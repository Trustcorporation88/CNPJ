// Consulta de empresas recém-abertas, a partir das tabelas do schema cnpj no Supabase.
// Os dados vêm da base pública da Receita e são enviados por `npm run sincronizar`.
import pg from 'pg'

export const TIPOS = ['mei', 'micro', 'individual']
const TIPO_SQL = {
  mei: 'e.mei',
  // A Receita classifica o MEI como microempresa; aqui ele fica de fora.
  micro: "(e.porte = '01' AND NOT e.mei)",
  individual: "(e.natureza_juridica = '2135' AND NOT e.mei)",
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

// ---------- Conexão ----------
let pool = null

function conexao() {
  if (pool) return pool
  const url = process.env.SUPABASE_DB_URL
  if (!url) {
    throw new ErroConsulta('A busca de novas empresas não está configurada no servidor (SUPABASE_DB_URL).', 503)
  }
  // O pooler do Supabase usa certificado da própria CA; a conexão é cifrada mesmo sem validá-lo.
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url)
  pool = new pg.Pool({ connectionString: url, max: 5, ssl: local ? false : { rejectUnauthorized: false } })
  pool.on('error', (e) => console.error('novas-empresas (pool):', e.message))
  return pool
}

async function linhas(sql, params = []) {
  try {
    return (await conexao().query(sql, params)).rows
  } catch (e) {
    if (e instanceof ErroConsulta) throw e
    if (e.code === '57014') throw new ErroConsulta('A consulta demorou demais. Refine os filtros (período, UF ou CNAE).', 504)
    throw e
  }
}

// ---------- Status da base ----------
let cacheStatus = null

export async function statusBase() {
  if (cacheStatus && Date.now() - cacheStatus.t < 60_000) return cacheStatus.v
  const meta = Object.fromEntries((await linhas('SELECT chave, valor FROM cnpj.metadados')).map((r) => [r.chave, r.valor]))
  if (!meta.data_corte) {
    throw new ErroConsulta('A base ainda não foi carregada no Supabase. Rode: npm run sincronizar', 503)
  }
  const v = {
    mes_referencia: meta.mes_referencia ?? null,
    importado_em: meta.importado_em ?? null,
    sincronizado_em: meta.sincronizado_em ?? null,
    ufs: (meta.ufs || '').split(',').filter(Boolean),
    data_corte: meta.data_corte,
    meses: Number(meta.meses) || null,
  }
  cacheStatus = { t: Date.now(), v }
  return v
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
    `e.data_abertura BETWEEN ${p(de)}::date AND ${p(ate)}::date`,
    `(${tipos.map((t) => TIPO_SQL[t]).join(' OR ')})`,
  ]
  if (q.filiais !== 'true') cond.push('e.matriz')
  if (ufs.length) cond.push(`e.uf = ANY(${p(ufs)}::text[])`)
  if (municipio) cond.push(`e.municipio_norm = ${p(municipio)}`)
  if (cnaes.length) {
    const exatos = cnaes.filter((c) => c.length === 7)
    const prefixos = cnaes.filter((c) => c.length < 7).map((c) => `${c}%`)
    const alt = []
    if (exatos.length) alt.push(`e.cnae_principal = ANY(${p(exatos)}::text[])`)
    if (prefixos.length) alt.push(`e.cnae_principal LIKE ANY(${p(prefixos)}::text[])`)
    if (q.secundario === 'true') {
      if (exatos.length) alt.push(`e.cnaes_secundarios && ${p(exatos)}::text[]`)
      if (prefixos.length) {
        alt.push(`EXISTS (SELECT 1 FROM unnest(e.cnaes_secundarios) s WHERE s LIKE ANY(${p(prefixos)}::text[]))`)
      }
    }
    cond.push(`(${alt.join(' OR ')})`)
  }

  return { where: `WHERE ${cond.join(' AND ')}`, params, periodo: { tipo: periodo, de, ate }, base }
}

// ---------- Consultas ----------
const SELECT = `SELECT e.cnpj, e.razao_social, e.nome_fantasia, e.matriz,
    to_char(e.data_abertura, 'YYYY-MM-DD') AS data_abertura, e.cnae_principal, c.descricao AS cnae_descricao,
    e.natureza_juridica, e.porte, e.mei, e.simples, e.capital_social, e.endereco, e.bairro, e.cep,
    e.municipio, e.uf, e.ddd_1, e.telefone_1, e.ddd_2, e.telefone_2, e.email
  FROM cnpj.novas_empresas e
  LEFT JOIN cnpj.cnaes c ON c.codigo = e.cnae_principal`

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
    capital_social: r.capital_social === null ? null : Number(r.capital_social),
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
  const [contagem, rows] = await Promise.all([
    linhas(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE e.mei)::int AS mei,
              count(*) FILTER (WHERE e.natureza_juridica = '2135' AND NOT e.mei)::int AS individual,
              count(*) FILTER (WHERE e.porte = '01' AND NOT e.mei
                               AND e.natureza_juridica IS DISTINCT FROM '2135')::int AS micro
         FROM cnpj.novas_empresas e ${where}`,
      params
    ).then((r) => r[0]),
    linhas(`${SELECT} ${where} ORDER BY e.data_abertura DESC, e.cnpj LIMIT $${n + 1} OFFSET $${n + 2}`, [
      ...params,
      limite,
      deslocamento,
    ]),
  ])
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
  const rows = await linhas(`${SELECT} ${where} ORDER BY e.data_abertura DESC, e.cnpj LIMIT $${params.length + 1}`, [
    ...params,
    MAX_CSV,
  ])
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
    return linhas('SELECT codigo, descricao FROM cnpj.cnaes WHERE starts_with(codigo, $1) ORDER BY codigo LIMIT 30', [
      digitos,
    ])
  }
  const palavras = t.split(' ').slice(0, 6)
  const cond = palavras.map((_, i) => `strpos(descricao_norm, $${i + 1}) > 0`).join(' AND ')
  return linhas(`SELECT codigo, descricao FROM cnpj.cnaes WHERE ${cond} ORDER BY codigo LIMIT 30`, palavras)
}
