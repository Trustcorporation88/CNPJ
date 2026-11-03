// Envia as aberturas recentes da base local da Receita (gerada pelo radar-cnpj-mcp)
// para o Supabase, que é de onde o site lê a aba "Novas empresas".
//
//   npx radar-cnpj-mcp baixar --ufs SP
//   SUPABASE_SYNC_URL='postgresql://cnpj_sync.<ref>:<senha>@<pooler>:5432/postgres' npm run sincronizar
//
// Variáveis opcionais: RADAR_CNPJ_DB (caminho da base) e MESES (padrão 24).
import { createReadStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { DuckDBInstance } from '@duckdb/node-api'
import pg from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

const COLUNAS = [
  'cnpj', 'razao_social', 'nome_fantasia', 'matriz', 'data_abertura', 'cnae_principal', 'cnaes_secundarios',
  'natureza_juridica', 'porte', 'mei', 'simples', 'capital_social', 'endereco', 'bairro', 'cep', 'municipio',
  'municipio_norm', 'uf', 'ddd_1', 'telefone_1', 'ddd_2', 'telefone_2', 'email',
]
// Mesmo recorte da aba: só ativas e só os três tipos que ela mostra.
const FILTRO = "situacao = '02' AND (mei OR porte = '01' OR natureza_juridica = '2135')"

function caminhoBase() {
  if (process.env.RADAR_CNPJ_DB) return process.env.RADAR_CNPJ_DB
  const home = os.homedir()
  let dir
  if (process.platform === 'win32') dir = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local')
  else if (process.platform === 'darwin') dir = path.join(home, 'Library', 'Application Support')
  else dir = process.env.XDG_DATA_HOME || path.join(home, '.local', 'share')
  return path.join(dir, 'radar-cnpj-mcp', 'radar.duckdb')
}

const literal = (s) => `'${String(s).replaceAll("'", "''")}'`
const log = (msg) => console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`)

async function main() {
  const url = process.env.SUPABASE_SYNC_URL
  if (!url) throw new Error('Defina SUPABASE_SYNC_URL com a conexão do usuário cnpj_sync (veja o README).')
  const meses = Number.parseInt(process.env.MESES || '24', 10)
  if (!(meses >= 1 && meses <= 120)) throw new Error('MESES deve estar entre 1 e 120.')

  const arquivoBase = caminhoBase()
  log(`Lendo ${arquivoBase}`)
  const duck = await DuckDBInstance.create(arquivoBase, { access_mode: 'READ_ONLY' })
  const d = await duck.connect()
  const linhas = async (sql) => (await d.runAndReadAll(sql)).getRowObjectsJson()

  const meta = Object.fromEntries((await linhas('SELECT chave, valor FROM metadados')).map((r) => [r.chave, r.valor]))
  const [{ corte }] = await linhas(
    'SELECT max(data_abertura)::VARCHAR AS corte FROM estabelecimentos WHERE data_abertura <= current_date'
  )
  const inicio = `(DATE ${literal(corte)} - INTERVAL ${meses} MONTH)`
  const onde = `WHERE ${FILTRO} AND data_abertura > ${inicio} AND data_abertura <= DATE ${literal(corte)}`

  const tmp = await mkdtemp(path.join(os.tmpdir(), 'cnpj-sync-'))
  const csvEmpresas = path.join(tmp, 'empresas.csv')
  const csvCnaes = path.join(tmp, 'cnaes.csv')
  const selecao = COLUNAS.map((c) =>
    c === 'cnaes_secundarios' ? "'{' || array_to_string(cnaes_secundarios, ',') || '}' AS cnaes_secundarios" : c
  ).join(', ')
  await d.run(`COPY (SELECT ${selecao} FROM estabelecimentos ${onde}) TO ${literal(csvEmpresas)} (HEADER false)`)
  await d.run(`COPY (SELECT codigo, descricao, descricao_norm FROM cnaes) TO ${literal(csvCnaes)} (HEADER false)`)
  const [{ n }] = await linhas(`SELECT count(*)::INTEGER AS n FROM estabelecimentos ${onde}`)
  d.closeSync()
  duck.closeSync()
  log(`${n.toLocaleString('pt-BR')} empresas abertas nos ${meses} meses até ${corte} (base ${meta.mes_referencia}, UFs ${meta.ufs})`)

  const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await db.connect()
  const copiar = (tabela, colunas, arquivo) =>
    pipeline(createReadStream(arquivo), db.query(copyFrom(`COPY ${tabela} (${colunas}) FROM STDIN WITH (FORMAT csv)`)))
  try {
    // TRUNCATE + COPY direto gasta o mínimo de disco (sem cópia temporária nem versões antigas).
    // As consultas do site esperam alguns segundos, até o COMMIT, e então veem os dados novos.
    await db.query('BEGIN')
    await db.query('TRUNCATE cnpj.novas_empresas, cnpj.cnaes')
    log('Enviando ao Supabase...')
    await copiar('cnpj.novas_empresas', COLUNAS.join(', '), csvEmpresas)
    await copiar('cnpj.cnaes', 'codigo, descricao, descricao_norm', csvCnaes)
    const novosMeta = {
      mes_referencia: meta.mes_referencia ?? null,
      ufs: meta.ufs ?? '',
      importado_em: meta.importado_em ?? null,
      data_corte: corte,
      meses: String(meses),
      sincronizado_em: new Date().toISOString(),
    }
    await db.query('DELETE FROM cnpj.metadados')
    for (const [chave, valor] of Object.entries(novosMeta)) {
      await db.query('INSERT INTO cnpj.metadados (chave, valor) VALUES ($1, $2)', [chave, valor])
    }
    await db.query('COMMIT')
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  }
  log('Atualizando estatísticas...')
  await db.query('VACUUM ANALYZE cnpj.novas_empresas')
  await db.query('ANALYZE cnpj.cnaes')
  await db.end()
  await rm(tmp, { recursive: true, force: true })
  log('Pronto.')
}

main().catch((e) => {
  console.error(`Erro: ${e.message}`)
  process.exit(1)
})
