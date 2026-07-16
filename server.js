import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const SINTEGRA_TOKEN = process.env.SINTEGRA_TOKEN || ''
const ACCESS_KEY = process.env.ACCESS_KEY || ''
const SWS_BASE = 'https://www.sintegraws.com.br/api/v1'

// ---------- Cache simples em memória (24h) para não gastar créditos repetidos ----------
const cache = new Map()
const TTL = 24 * 60 * 60 * 1000
const cacheGet = (key) => {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.t > TTL) {
    cache.delete(key)
    return null
  }
  return hit.v
}
const cacheSet = (key, v) => cache.set(key, { v, t: Date.now() })

// ---------- Proteção por chave de acesso (se ACCESS_KEY estiver definida) ----------
const auth = (req, res, next) => {
  if (!ACCESS_KEY) return next()
  if (req.headers['x-access-key'] === ACCESS_KEY) return next()
  res.status(401).json({ error: 'Chave de acesso inválida ou ausente.' })
}

// ---------- Helper para chamar o SintegraWS ----------
import https from 'node:https'

const SWS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 CentralConsultas/1.0',
  Accept: 'application/json, text/plain, */*',
}

// GET via https nativo, forçando IPv4 (family: 4) — evita travas de rota IPv6 no host
function httpsGet(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: SWS_HEADERS, family: 4, timeout: timeoutMs }, (r) => {
      let body = ''
      r.on('data', (c) => (body += c))
      r.on('end', () => resolve({ status: r.statusCode, body }))
    })
    req.on('timeout', () => req.destroy(new Error('TIMEOUT')))
    req.on('error', reject)
  })
}

async function sws(params, res, { cacheable = true } = {}) {
  if (!SINTEGRA_TOKEN) {
    return res.status(500).json({ error: 'SINTEGRA_TOKEN não configurado no servidor.' })
  }
  const qs = new URLSearchParams({ token: SINTEGRA_TOKEN, ...params })
  const cacheKey = new URLSearchParams(params).toString()
  if (cacheable) {
    const hit = cacheGet(cacheKey)
    if (hit) return res.json({ ...hit, _cache: true })
  }
  const url = `${SWS_BASE}/execute-api.php?${qs}`
  let lastErr
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await httpsGet(url)
      let data
      try {
        data = JSON.parse(r.body)
      } catch {
        // Nota: status 500 (e não 502/504) para o corpo atravessar o proxy do Cloudflare intacto
        return res.status(500).json({
          error: `SintegraWS respondeu HTTP ${r.status} com conteúdo não-JSON.`,
          detail: r.body.slice(0, 300),
        })
      }
      if (cacheable && (data.code === '0' || data.status === 'OK')) cacheSet(cacheKey, data)
      return res.json(data)
    } catch (e) {
      lastErr = e
    }
  }
  const timedOut = /TIMEOUT/i.test(String(lastErr))
  res.status(500).json({
    error: timedOut
      ? 'O SintegraWS demorou mais de 60s para responder, mesmo após 2 tentativas (órgão possivelmente instável).'
      : 'Falha de conexão do servidor com o SintegraWS após 2 tentativas.',
    detail: `${lastErr?.code ?? ''} ${lastErr?.message ?? ''}`.trim(),
  })
}

app.get('/api/health', (_req, res) => res.json({ ok: true, protected: Boolean(ACCESS_KEY) }))

app.get('/api/saldo', auth, async (_req, res) => {
  if (!SINTEGRA_TOKEN) return res.status(500).json({ error: 'SINTEGRA_TOKEN não configurado no servidor.' })
  try {
    const r = await fetch(`${SWS_BASE}/consulta-saldo.php?token=${SINTEGRA_TOKEN}`)
    res.json(await r.json())
  } catch (e) {
    res.status(500).json({ error: 'Falha ao consultar saldo.', detail: String(e) })
  }
})

const onlyDigits = (s) => String(s || '').replace(/\D/g, '')

app.get('/api/sws/rf', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  sws({ cnpj, plugin: 'RF' }, res)
})

app.get('/api/sws/sintegra', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  const params = { cnpj, plugin: 'ST' }
  if (req.query.uf) params.uf = String(req.query.uf).toUpperCase().slice(0, 2)
  sws(params, res)
})

app.get('/api/sws/simples', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  sws({ cnpj, plugin: 'SN' }, res)
})

app.get('/api/sws/suframa', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  sws({ cnpj, plugin: 'SF' }, res)
})

app.get('/api/sws/cpf', auth, (req, res) => {
  const cpf = onlyDigits(req.query.cpf)
  const nasc = onlyDigits(req.query.nascimento) // ddmmaaaa
  if (cpf.length !== 11) return res.status(400).json({ error: 'CPF inválido.' })
  if (nasc.length !== 8) return res.status(400).json({ error: 'Data de nascimento inválida (use dd/mm/aaaa).' })
  sws({ cpf, 'data-nascimento': nasc, plugin: 'CPF' }, res)
})

// ---------- Frontend estático ----------
app.use(express.static(path.join(__dirname, 'dist')))
app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`))
