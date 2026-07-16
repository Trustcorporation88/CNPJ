import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const SINTEGRA_TOKEN = process.env.SINTEGRA_TOKEN || ''
const CNPJA_TOKEN = process.env.CNPJA_TOKEN || ''
const CNPJA_BASE = 'https://api.cnpja.com'
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
function httpsGet(url, timeoutMs = 8000) {
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

// Núcleo: retorna { ok, data } ou { ok:false, error, detail, status } — não escreve na resposta
async function swsCore(params, { cacheable = true } = {}) {
  if (!SINTEGRA_TOKEN) return { ok: false, error: 'SINTEGRA_TOKEN não configurado no servidor.' }
  const qs = new URLSearchParams({ token: SINTEGRA_TOKEN, ...params })
  const cacheKey = 'sws:' + new URLSearchParams(params).toString()
  if (cacheable) {
    const hit = cacheGet(cacheKey)
    if (hit) return { ok: true, data: { ...hit, _cache: true } }
  }
  const url = `${SWS_BASE}/execute-api.php?${qs}`
  let lastErr
  // Uma única tentativa curta: se o SintegraWS não responder rápido, o fallback assume
  for (let attempt = 1; attempt <= 1; attempt++) {
    try {
      const r = await httpsGet(url)
      let data
      try {
        data = JSON.parse(r.body)
      } catch {
        const isHtml = /<html|<!doctype/i.test(r.body)
        return {
          ok: false,
          error: isHtml
            ? 'Sem registro nesse serviço para este CNPJ, ou o órgão de origem está indisponível no momento.'
            : `SintegraWS respondeu HTTP ${r.status} com conteúdo não-JSON.`,
          detail: isHtml ? '' : r.body.slice(0, 300),
        }
      }
      // O SintegraWS usa code "0" para sucesso; qualquer outro é falha lógica
      if (data.code && data.code !== '0' && data.status !== 'OK') {
        return { ok: false, error: data.message || 'Consulta não retornou dados.', logical: true, data }
      }
      if (cacheable) cacheSet(cacheKey, data)
      return { ok: true, data }
    } catch (e) {
      lastErr = e
    }
  }
  const timedOut = /TIMEOUT/i.test(String(lastErr))
  return {
    ok: false,
    error: timedOut
      ? 'O SintegraWS não respondeu rápido (órgão possivelmente instável).'
      : 'Falha de conexão do servidor com o SintegraWS.',
    detail: `${lastErr?.code ?? ''} ${lastErr?.message ?? ''}`.trim(),
  }
}

// Wrapper que escreve a resposta HTTP a partir do resultado do core
function sendResult(res, result) {
  if (result.ok) return res.json(result.data)
  return res.status(500).json({ error: result.error, detail: result.detail })
}

async function sws(params, res, opts) {
  sendResult(res, await swsCore(params, opts))
}

app.get('/api/health', (_req, res) => res.json({ ok: true, protected: Boolean(ACCESS_KEY) }))

// Valida a chave de acesso (usado pela tela de login)
app.get('/api/verify', auth, (_req, res) => res.json({ ok: true }))

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

// ---------- CNPJá ----------
// Núcleo: retorna { ok, data } ou { ok:false, error, detail }
async function cnpjaCore(cnpj, query) {
  if (!CNPJA_TOKEN) return { ok: false, error: 'CNPJA_TOKEN não configurado no servidor.' }
  const cacheKey = `cnpja:${cnpj}:${new URLSearchParams(query).toString()}`
  const hit = cacheGet(cacheKey)
  if (hit) return { ok: true, data: { ...hit, _cache: true } }

  const qs = new URLSearchParams(query).toString()
  const url = `${CNPJA_BASE}/office/${cnpj}${qs ? `?${qs}` : ''}`
  let lastErr
  for (let attempt = 1; attempt <= 1; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { Authorization: CNPJA_TOKEN, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      })
      const text = await r.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        return { ok: false, error: `CNPJá respondeu HTTP ${r.status} inesperado.`, detail: text.slice(0, 300) }
      }
      if (r.status === 401) return { ok: false, error: 'Chave do CNPJá inválida (verifique CNPJA_TOKEN).' }
      if (r.status === 402) return { ok: false, error: 'Créditos do CNPJá esgotados.' }
      if (r.status === 429) return { ok: false, error: 'Limite de consultas por minuto do CNPJá excedido. Aguarde um instante.' }
      if (r.status === 404) return { ok: false, error: 'CNPJ não encontrado na base do CNPJá.' }
      if (!r.ok) return { ok: false, error: data?.message || `CNPJá respondeu HTTP ${r.status}.` }
      cacheSet(cacheKey, data)
      return { ok: true, data }
    } catch (e) {
      lastErr = e
    }
  }
  return {
    ok: false,
    error: 'Falha de conexão do servidor com o CNPJá.',
    detail: `${lastErr?.name ?? ''} ${lastErr?.message ?? ''}`.trim(),
  }
}

// Consulta unificada CNPJá: cadastral + flags opcionais
app.get('/api/cnpja/office', auth, async (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  const q = {}
  if (req.query.simples === 'true') q.simples = 'true'
  if (req.query.registrations) q.registrations = String(req.query.registrations).toUpperCase()
  if (req.query.suframa === 'true') q.suframa = 'true'
  if (req.query.fresh === 'true') {
    q.strategy = 'CACHE_IF_FRESH'
    q.maxAge = '1'
  }
  sendResult(res, await cnpjaCore(cnpj, q))
})

// ---------- Consultas com FALLBACK automático ----------
// Tenta o SintegraWS primeiro (consome os créditos já pagos). Se falhar por
// indisponibilidade/timeout, cai automaticamente no CNPJá. O campo _provedor
// e _fallback informam ao front de onde veio o dado.
async function comFallback(res, swsParams, cnpjaFlags, cnpjNum) {
  const sw = await swsCore(swsParams)
  if (sw.ok) return res.json({ ...sw.data, _provedor: 'SintegraWS' })

  // SintegraWS falhou — tenta CNPJá se estiver configurado
  if (CNPJA_TOKEN) {
    const cj = await cnpjaCore(cnpjNum, cnpjaFlags)
    if (cj.ok) {
      return res.json({ ...cj.data, _provedor: 'CNPJá', _fallback: true, _motivoSintegra: sw.error })
    }
    return res.status(500).json({
      error: `SintegraWS indisponível e o CNPJá também não respondeu. (Sintegra: ${sw.error} | CNPJá: ${cj.error})`,
    })
  }
  return res.status(500).json({ error: sw.error, detail: sw.detail })
}

// SINTEGRA (IE detalhada) → fallback para CNPJá com inscrições do estado de origem
app.get('/api/ie', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  const swsParams = { cnpj, plugin: 'ST' }
  if (req.query.uf) swsParams.uf = String(req.query.uf).toUpperCase().slice(0, 2)
  comFallback(res, swsParams, { registrations: 'ALL' }, cnpj)
})

// Suframa → fallback para CNPJá com suframa=true
app.get('/api/suframa', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  comFallback(res, { cnpj, plugin: 'SF' }, { suframa: 'true' }, cnpj)
})

// Simples Nacional → fallback para CNPJá com simples=true
app.get('/api/simples', auth, (req, res) => {
  const cnpj = onlyDigits(req.query.cnpj)
  if (cnpj.length !== 14) return res.status(400).json({ error: 'CNPJ inválido.' })
  comFallback(res, { cnpj, plugin: 'SN' }, { simples: 'true' }, cnpj)
})

// ---------- Frontend estático ----------
app.use(express.static(path.join(__dirname, 'dist')))
app.get(/.*/, (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`))
