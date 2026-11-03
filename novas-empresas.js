// Consulta de empresas recém-abertas na base local da Receita Federal.
// A base é o arquivo DuckDB gerado por `npx radar-cnpj-mcp baixar --ufs SP`.
import { stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Mesmo caminho padrão usado pelo radar-cnpj-mcp, para o `baixar` funcionar sem configuração.
function defaultDbPath() {
  const home = os.homedir()
  let dataDir
  if (process.platform === 'win32') dataDir = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local')
  else if (process.platform === 'darwin') dataDir = path.join(home, 'Library', 'Application Support')
  else dataDir = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share')
  return path.join(dataDir, 'radar-cnpj-mcp', 'radar.duckdb')
}

export const DB_PATH = process.env.RADAR_CNPJ_DB || defaultDbPath()

export const TIPOS = ['mei', 'micro', 'individual']
const TIPO_SQL = {
  mei: 'mei',
  // A Receita classifica o MEI como microempresa; aqui ele fica de fora.
  micro: "(porte = '01' AND NOT mei)",
  individual: "(natureza_juridica = '2135' AND NOT mei)",
}
const PERIODOS = { semana: 7, mes: 30 }
const UFS = new Set('AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO EX'.split(' '))
const PORTES = { '00': 'Não informado', '01': 'Microempresa', '03': 'Empresa de pequeno porte', '05': 'Demais' }
const NATUREZAS = {
  2135: 'Empresário individual',
  2062: 'Sociedade empresária limitada',
  2305: 'EIRELI',
  2240: 'Sociedade simples limitada',
  2046: 'Sociedade anônima fechada',
}
export const MAX_PAGINA = 200
export const MAX_CSV = 50000

export class ErroConsulta extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

// ---------- Conexão (somente leitura, reaberta quando o arquivo é substituído) ----------
let aberta = null // { versao, db, conn, info }

async function versaoArquivo() {
  const s = await stat(DB_PATH).catch(() => null)
  return s ? `${s.ino}:${s.mtimeMs}` : null
}

async function conexao() {
  const versao = await versaoArquivo()
  if (!versao) {
    throw new ErroConsulta(
      `Base da Receita não encontrada em ${DB_PATH}. Gere com: npx radar-cnpj-mcp baixar --ufs SP`,
      503
    )
  }
  if (aberta?.versao === versao) return aberta
  fechar()
  // Import dinâmico: se o DuckDB não carregar, só esta funcionalidade fica indisponível.
  const { DuckDBInstance } = await import('@duckdb/node-api')
  const db = await DuckDBInstance.create(DB_PATH, { access_mode: 'READ_ONLY' })
  const conn = await db.connect()
  aberta = { versao, db, conn, info: null }
  return aberta
}

export function fechar() {
  if (!aberta) return
  try {
    aberta.conn.closeSync()
    aberta.db.closeSync()
  } catch {
    /* já fechada */
  }
  aberta = null
}

async function linhas(sql, params = []) {
  const { conn } = await conexao()
  const reader = await conn.runAndReadAll(sql, params)
  return reader.getRowObjectsJson()
}

// ---------- Status da base ----------
export async function statusBase() {
  const c = await conexao()
  if (c.info) return c.info
  const meta = Object.fromEntries((await linhas('SELECT chave, valor FROM metadados')).map((r) => [r.chave, r.valor]))
  // Ignora datas futuras digitadas errado na Receita.
  const [{ corte }] = await linhas(
    'SELECT max(data_abertura)::VARCHAR AS corte FROM estabelecimentos WHERE data_abertura <= current_date'
  )
  c.info = {
    mes_referencia: meta.mes_referencia ?? null,
    importado_em: meta.importado_em ?? null,
    ufs: (meta.ufs || '').split(',').filter(Boolean),
    data_corte: corte,
  }
  return c.info
}

// ---------- Filtros ----------
const isoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const lista = (v) =>
  (Array.isArray(v) ? v : String(v ?? '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean)

const normalizar = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Valida a query string e devolve o WHERE parametrizado e o período usado. */
export async function montarFiltro(q) {
  const tipos = lista(q.tipos)
  if (tipos.length === 0) throw new ErroConsulta('Escolha ao menos um tipo: MEI, microempresa ou empresário individual.')
  const invalido = tipos.find((t) => !TIPOS.includes(t))
  if (invalido) throw new ErroConsulta(`Tipo inválido: ${invalido}.`)

  const cnaes = lista(q.cnaes).map((c) => c.replace(/\D/g, ''))
  if (cnaes.some((c) => c.length < 2 || c.length > 7)) {
    throw new ErroConsulta('CNAE deve ter de 2 a 7 dígitos, ex.: 4520-0/01, 4520001 ou 4520.')
  }
  if (cnaes.length > 50) throw new ErroConsulta('Informe no máximo 50 CNAEs.')

  const ufs = lista(q.ufs).map((u) => u.toUpperCase())
  const ufInvalida = ufs.find((u) => !UFS.has(u))
  if (ufInvalida) throw new ErroConsulta(`UF inválida: ${ufInvalida}.`)

  const municipio = q.municipio ? normalizar(String(q.municipio)) : ''

  const base = await statusBase()
  let de
  let ate
  const periodo = String(q.periodo || 'mes')
  if (PERIODOS[periodo]) {
    if (!base.data_corte) throw new ErroConsulta('A base não tem datas de abertura.', 503)
    ate = base.data_corte
    de = addDays(ate, -(PERIODOS[periodo] - 1))
  } else if (periodo === 'personalizado') {
    de = String(q.de || '')
    ate = String(q.ate || '')
    if (!isoDate(de) || !isoDate(ate)) throw new ErroConsulta('Informe as datas no formato AAAA-MM-DD.')
    if (de > ate) throw new ErroConsulta('A data inicial é maior que a final.')
  } else {
    throw new ErroConsulta('Período inválido. Use semana, mes ou personalizado.')
  }

  const params = []
  const p = (v) => {
    params.push(v)
    return `$${params.length}`
  }
  const cond = [
    `data_abertura BETWEEN ${p(de)}::DATE AND ${p(ate)}::DATE`,
    `(${tipos.map((t) => TIPO_SQL[t]).join(' OR ')})`,
  ]
  if (q.situacao !== 'todas') cond.push("situacao = '02'")
  if (q.filiais !== 'true') cond.push('matriz')
  if (ufs.length) cond.push(`uf IN (${ufs.map(p).join(', ')})`)
  if (municipio) cond.push(`municipio_norm = ${p(municipio)}`)
  if (cnaes.length) {
    const exatos = cnaes.filter((c) => c.length === 7)
    const prefixos = cnaes.filter((c) => c.length < 7)
    const alt = []
    if (exatos.length) alt.push(`cnae_principal IN (${exatos.map(p).join(', ')})`)
    for (const pre of prefixos) alt.push(`starts_with(cnae_principal, ${p(pre)})`)
    if (q.secundario === 'true') {
      if (exatos.length) alt.push(`list_has_any(cnaes_secundarios, [${exatos.map(p).join(', ')}])`)
      for (const pre of prefixos) {
        alt.push(`len(list_filter(cnaes_secundarios, lambda x: starts_with(x, ${p(pre)}))) > 0`)
      }
    }
    cond.push(`(${alt.join(' OR ')})`)
  }

  return { where: `WHERE ${cond.join(' AND ')}`, params, periodo: { tipo: periodo, de, ate }, base }
}

// ---------- Consultas ----------
const COLUNAS = `cnpj, razao_social, nome_fantasia, matriz, data_abertura::VARCHAR AS data_abertura,
  cnae_principal, cnae_descricao, natureza_juridica, porte, mei, simples, capital_social,
  endereco, bairro, cep, municipio, uf, ddd_1, telefone_1, ddd_2, telefone_2, email`

function empresa(r, ocultarContatosMei) {
  const ocultar = ocultarContatosMei && r.mei
  const telefones = ocultar
    ? []
    : [
        [r.ddd_1, r.telefone_1],
        [r.ddd_2, r.telefone_2],
      ]
        .filter(([, n]) => n)
        .map(([d, n]) => (d ? `(${d}) ${n}` : n))
  return {
    cnpj: r.cnpj,
    razao_social: r.razao_social,
    nome_fantasia: r.nome_fantasia,
    tipo: r.mei ? 'MEI' : r.natureza_juridica === '2135' ? 'Empresário individual' : PORTES[r.porte] || 'Não informado',
    porte: PORTES[r.porte] || null,
    natureza_juridica: NATUREZAS[r.natureza_juridica] || r.natureza_juridica,
    mei: r.mei,
    simples: r.simples,
    matriz: r.matriz,
    data_abertura: r.data_abertura,
    cnae_principal: r.cnae_principal,
    cnae_descricao: r.cnae_descricao,
    capital_social: r.capital_social,
    endereco: r.endereco,
    bairro: r.bairro,
    cep: r.cep,
    municipio: r.municipio,
    uf: r.uf,
    telefones,
    email: ocultar ? null : r.email,
    contatos_ocultos: ocultar || undefined,
  }
}

const inteiro = (v, padrao, min, max) => {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? padrao : Math.min(max, Math.max(min, n))
}

export async function buscar(q) {
  const { where, params, periodo, base } = await montarFiltro(q)
  const limite = inteiro(q.limite, 50, 1, MAX_PAGINA)
  const deslocamento = inteiro(q.deslocamento, 0, 0, 10_000_000)
  const n = params.length
  const [contagem] = await linhas(
    `SELECT count(*)::INTEGER AS total,
            count_if(mei)::INTEGER AS mei,
            count_if(natureza_juridica = '2135' AND NOT mei)::INTEGER AS individual,
            count_if(porte = '01' AND NOT mei AND natureza_juridica IS DISTINCT FROM '2135')::INTEGER AS micro
       FROM estabelecimentos ${where}`,
    params
  )
  const rows = await linhas(
    `SELECT ${COLUNAS} FROM estabelecimentos ${where}
      ORDER BY data_abertura DESC, cnpj LIMIT $${n + 1} OFFSET $${n + 2}`,
    [...params, limite, deslocamento]
  )
  const { total, ...porTipo } = contagem
  return {
    base,
    periodo,
    total,
    por_tipo: porTipo,
    limite,
    deslocamento,
    empresas: rows.map((r) => empresa(r, q.ocultar_contatos_mei === 'true')),
  }
}

const CSV_COLUNAS = [
  ['cnpj', 'CNPJ'],
  ['razao_social', 'Razão social'],
  ['nome_fantasia', 'Nome fantasia'],
  ['tipo', 'Tipo'],
  ['natureza_juridica', 'Natureza jurídica'],
  ['data_abertura', 'Data de abertura'],
  ['cnae_principal', 'CNAE principal'],
  ['cnae_descricao', 'Atividade principal'],
  ['capital_social', 'Capital social'],
  ['endereco', 'Endereço'],
  ['bairro', 'Bairro'],
  ['cep', 'CEP'],
  ['municipio', 'Município'],
  ['uf', 'UF'],
  ['telefones', 'Telefones'],
  ['email', 'E-mail'],
]

function campoCsv(v) {
  if (v === null || v === undefined) return ''
  let s = Array.isArray(v) ? v.join(' / ') : String(v)
  // Impede que o Excel interprete o conteúdo como fórmula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export async function csv(q) {
  const { where, params } = await montarFiltro(q)
  const rows = await linhas(
    `SELECT ${COLUNAS} FROM estabelecimentos ${where}
      ORDER BY data_abertura DESC, cnpj LIMIT $${params.length + 1}`,
    [...params, MAX_CSV]
  )
  const ocultar = q.ocultar_contatos_mei === 'true'
  const corpo = rows.map((r) => {
    const e = empresa(r, ocultar)
    return CSV_COLUNAS.map(([k]) => campoCsv(e[k])).join(';')
  })
  return `\uFEFF${[CSV_COLUNAS.map(([, rotulo]) => rotulo).join(';'), ...corpo].join('\r\n')}\r\n`
}

export async function buscarCnae(termo) {
  const t = normalizar(String(termo || ''))
  if (t.length < 2) return []
  const digitos = t.replace(/[\s./-]/g, '')
  if (/^\d+$/.test(digitos)) {
    return linhas('SELECT codigo, descricao FROM cnaes WHERE starts_with(codigo, $1) ORDER BY codigo LIMIT 30', [
      digitos,
    ])
  }
  const palavras = t.split(' ').slice(0, 6)
  const cond = palavras.map((_, i) => `contains(descricao_norm, $${i + 1})`).join(' AND ')
  return linhas(`SELECT codigo, descricao FROM cnaes WHERE ${cond} ORDER BY codigo LIMIT 30`, palavras)
}
