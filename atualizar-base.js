// Atualiza a base da Receita baixando o radar.duckdb de um bucket do Cloudflare R2
// (ou de RADAR_CNPJ_DB_URL). O servidor busca o arquivo, então o limite de upload
// do proxy da Cloudflare no domínio não se aplica.
import { createHash, createHmac } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, open, rename, rm } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { DB_PATH, fechar } from './novas-empresas.js'

const R2 = {
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucket: process.env.R2_BUCKET || '',
  key: process.env.R2_OBJECT || 'radar.duckdb',
}
const URL_DIRETA = process.env.RADAR_CNPJ_DB_URL || ''

const sha256 = (s) => createHash('sha256').update(s).digest('hex')
const hmac = (k, s) => createHmac('sha256', k).update(s).digest()
// S3 exige RFC 3986: encodeURIComponent deixa !'()* sem codificar.
const encode = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

/** Monta um GET assinado (AWS Signature V4) para a API S3 do R2. */
export function requisicaoR2({ accountId, accessKeyId, secretAccessKey, bucket, key }, agora = new Date()) {
  const host = `${accountId}.r2.cloudflarestorage.com`
  const caminho = `/${[bucket, ...key.split('/')].map(encode).join('/')}`
  const amzDate = agora.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const dia = amzDate.slice(0, 8)
  const payload = sha256('')
  const assinados = 'host;x-amz-content-sha256;x-amz-date'
  const canonica = [
    'GET',
    caminho,
    '',
    `host:${host}\nx-amz-content-sha256:${payload}\nx-amz-date:${amzDate}\n`,
    assinados,
    payload,
  ].join('\n')
  const escopo = `${dia}/auto/s3/aws4_request`
  const paraAssinar = ['AWS4-HMAC-SHA256', amzDate, escopo, sha256(canonica)].join('\n')
  const chave = ['auto', 's3', 'aws4_request'].reduce((k, parte) => hmac(k, parte), hmac(`AWS4${secretAccessKey}`, dia))
  const assinatura = createHmac('sha256', chave).update(paraAssinar).digest('hex')
  return {
    url: `https://${host}${caminho}`,
    headers: {
      'x-amz-content-sha256': payload,
      'x-amz-date': amzDate,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${escopo}, SignedHeaders=${assinados}, Signature=${assinatura}`,
    },
  }
}

function origem() {
  if (R2.accountId && R2.accessKeyId && R2.secretAccessKey && R2.bucket) {
    return { descricao: `Cloudflare R2 (${R2.bucket}/${R2.key})`, ...requisicaoR2(R2) }
  }
  if (URL_DIRETA) return { descricao: new URL(URL_DIRETA).host, url: URL_DIRETA, headers: {} }
  return null
}

export const origemConfigurada = () => {
  try {
    return origem()?.descricao ?? null
  } catch {
    return null
  }
}

let estado = { estado: 'parado' }

export const statusAtualizacao = () => ({ ...estado, origem: origemConfigurada() })

/** Inicia o download em segundo plano; devolve false se já houver um em andamento. */
export function iniciarAtualizacao() {
  if (estado.estado === 'baixando' || estado.estado === 'validando') return false
  const src = origem()
  if (!src) {
    throw Object.assign(
      new Error('Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET (ou RADAR_CNPJ_DB_URL) no servidor.'),
      { status: 400 }
    )
  }
  estado = { estado: 'baixando', iniciado_em: new Date().toISOString(), baixados: 0, total: null }
  baixar(src).catch((e) => {
    estado = { ...estado, estado: 'erro', erro: e.message, terminado_em: new Date().toISOString() }
  })
  return true
}

async function baixar({ url, headers }) {
  const temporario = `${DB_PATH}.baixando`
  await mkdir(path.dirname(DB_PATH), { recursive: true })
  try {
    const res = await get(url, headers)
    if (res.statusCode !== 200) {
      let corpo = ''
      for await (const pedaco of res) if (corpo.length < 2000) corpo += pedaco
      corpo = corpo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      throw new Error(`A origem respondeu HTTP ${res.statusCode}. ${corpo}`.trim())
    }
    estado.total = Number(res.headers['content-length']) || null
    const contador = new Transform({
      transform(pedaco, _enc, cb) {
        estado.baixados += pedaco.length
        cb(null, pedaco)
      },
    })
    await pipeline(res, contador, createWriteStream(temporario))
    if (estado.total && estado.baixados !== estado.total) {
      throw new Error(`Download incompleto (${estado.baixados} de ${estado.total} bytes).`)
    }

    estado.estado = 'validando'
    await validar(temporario)
    fechar()
    await rename(temporario, DB_PATH)
    estado = { ...estado, estado: 'concluido', terminado_em: new Date().toISOString() }
  } catch (e) {
    await rm(temporario, { force: true })
    if (e.message === 'aborted' || e.code === 'ECONNRESET') {
      throw new Error('A conexão com a origem caiu no meio do download. A base atual foi mantida; tente de novo.')
    }
    throw e
  }
}

// http/https nativos em vez de fetch: o undici do Node 22 derruba o processo com
// "assert(!this.paused)" quando a conexão fecha durante a contrapressão do disco.
function get(url, headers, redirecionamentos = 5) {
  return new Promise((resolve, reject) => {
    const cliente = url.startsWith('https:') ? https : http
    const req = cliente.get(url, { headers, family: 4 }, (res) => {
      const destino = res.headers.location
      if (res.statusCode >= 300 && res.statusCode < 400 && destino && redirecionamentos > 0) {
        res.resume()
        resolve(get(new URL(destino, url).toString(), {}, redirecionamentos - 1))
        return
      }
      resolve(res)
    })
    req.setTimeout(60_000, () => req.destroy(new Error('A origem parou de responder por 60 s.')))
    req.on('error', reject)
  })
}

// Confere que é uma base gerada pelo radar-cnpj-mcp antes de substituir a atual.
async function validar(arquivo) {
  const fh = await open(arquivo, 'r')
  const cabecalho = Buffer.alloc(12)
  await fh.read(cabecalho, 0, 12, 0)
  await fh.close()
  if (cabecalho.subarray(8, 12).toString() !== 'DUCK') {
    throw new Error('O arquivo baixado não é uma base DuckDB. Confira o objeto no bucket.')
  }
  const { DuckDBInstance } = await import('@duckdb/node-api')
  const db = await DuckDBInstance.create(arquivo, { access_mode: 'READ_ONLY' })
  try {
    const conn = await db.connect()
    const r = await conn.runAndReadAll(
      "SELECT count(*)::INTEGER AS n FROM information_schema.tables WHERE table_name IN ('estabelecimentos', 'metadados', 'cnaes')"
    )
    conn.closeSync()
    if (r.getRowObjectsJson()[0].n !== 3) {
      throw new Error('O arquivo baixado não tem as tabelas do radar-cnpj-mcp.')
    }
  } finally {
    db.closeSync()
  }
}
