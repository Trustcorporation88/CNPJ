// Diz se a Receita já publicou um mês mais novo, e completo, do que o que está no Supabase.
// Usado pela atualização automática (.github/workflows/atualizar-base.yml), mas roda também à mão:
//
//   SUPABASE_SYNC_URL='postgresql://cnpj_sync.<ref>:<senha>@<pooler>:5432/postgres' node scripts/verificar-mes-receita.js
//
// Escreve `novo=true|false` e `mes=AAAA-MM` em $GITHUB_OUTPUT quando existe.
import { appendFile } from 'node:fs/promises'
import pg from 'pg'
import { DEFAULT_SHARE_URL, parseListing, parseShareUrl } from 'radar-cnpj-mcp/dist/data/downloader.js'
import { classifyFile, REQUIRED_KINDS } from 'radar-cnpj-mcp/dist/data/layout.js'

const share = parseShareUrl(process.env.RADAR_CNPJ_RECEITA_URL || DEFAULT_SHARE_URL)

async function listar(pasta = '') {
  const r = await fetch(`${share.webdavUrl}/${pasta}`, {
    method: 'PROPFIND',
    headers: { Authorization: share.authorization, Depth: '1' },
    signal: AbortSignal.timeout(60_000),
  })
  if (!r.ok) throw new Error(`A Receita respondeu HTTP ${r.status} ao listar ${pasta || 'os meses'}.`)
  return parseListing(await r.text())
}

async function metadadosNoSupabase(url) {
  const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await db.connect()
  try {
    const { rows } = await db.query("SELECT chave, valor FROM cnpj.metadados WHERE chave IN ('mes_referencia', 'ufs')")
    return Object.fromEntries(rows.map((r) => [r.chave, r.valor]))
  } finally {
    await db.end()
  }
}

// O radar grava `ufs` vazio quando a base é do Brasil inteiro (--todas).
const conjuntoUfs = (s) =>
  String(s ?? '')
    .toUpperCase()
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u && u !== 'TODAS')
    .sort()
    .join(',')

async function main() {
  const url = process.env.SUPABASE_SYNC_URL
  if (!url) throw new Error('Defina SUPABASE_SYNC_URL com a conexão do usuário cnpj_sync (veja o README).')

  const meses = (await listar())
    .filter((e) => e.isDirectory && /^\d{4}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort()
  const ultimo = meses.at(-1)
  if (!ultimo) throw new Error('Nenhum mês encontrado na Receita.')

  // A Receita sobe os arquivos aos poucos: a pasta do mês aparece antes de estar completa.
  const arquivos = (await listar(`${ultimo}/`)).filter((e) => !e.isDirectory && classifyFile(e.name))
  const faltam = REQUIRED_KINDS.filter((k) => !arquivos.some((e) => classifyFile(e.name) === k))
  const meta = await metadadosNoSupabase(url)
  const atual = meta.mes_referencia ?? null
  const ufsDesejadas = process.env.UFS ? conjuntoUfs(process.env.UFS) : null
  const ufsAtuais = conjuntoUfs(meta.ufs)
  const mudouUfs = atual !== null && ufsDesejadas !== null && ufsDesejadas !== ufsAtuais

  let novo = false
  if (faltam.length > 0) console.log(`Receita: ${ultimo} ainda incompleto (faltam ${faltam.join(', ')}).`)
  else if (mudouUfs) {
    novo = true
    console.log(`UFs mudaram: Supabase tem ${ufsAtuais || 'todas'}, pedido ${ufsDesejadas || 'todas'}.`)
  } else if (atual && atual >= ultimo) console.log(`Supabase já está com ${atual}; mais recente na Receita: ${ultimo}.`)
  else {
    novo = true
    console.log(`Novo mês na Receita: ${ultimo} (Supabase: ${atual ?? 'vazio'}).`)
  }
  if (process.env.FORCAR === 'true' && faltam.length === 0 && !novo) {
    novo = true
    console.log('Atualização forçada.')
  }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `novo=${novo}\nmes=${ultimo}\n`)
}

main().catch((e) => {
  console.error(`Erro: ${e.message}`)
  process.exit(1)
})
