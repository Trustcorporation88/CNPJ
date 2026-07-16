import { useEffect, useState } from 'react'

// ---------- Ícones (SVG inline) ----------
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const icons = {
  search: (cls) => <Icon className={cls} path={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>} />,
  alert: (cls) => <Icon className={cls} path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />,
  building: (cls) => <Icon className={cls} path={<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" /></>} />,
  hash: (cls) => <Icon className={cls} path={<><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>} />,
  scale: (cls) => <Icon className={cls} path={<><path d="M12 3v18" /><path d="M5 7l7-4 7 4" /><path d="M2 13l3-6 3 6a3 3 0 0 1-6 0Z" /><path d="M16 13l3-6 3 6a3 3 0 0 1-6 0Z" /></>} />,
  calendar: (cls) => <Icon className={cls} path={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />,
  briefcase: (cls) => <Icon className={cls} path={<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>} />,
  money: (cls) => <Icon className={cls} path={<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} />,
  activity: (cls) => <Icon className={cls} path={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />} />,
  mapPin: (cls) => <Icon className={cls} path={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>} />,
  phone: (cls) => <Icon className={cls} path={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />} />,
  mail: (cls) => <Icon className={cls} path={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></>} />,
  layers: (cls) => <Icon className={cls} path={<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>} />,
  users: (cls) => <Icon className={cls} path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />,
  chevron: (cls) => <Icon className={cls} path={<polyline points="6 9 12 15 18 9" />} />,
  code: (cls) => <Icon className={cls} path={<><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>} />,
  card: (cls) => <Icon className={cls} path={<><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>} />,
  printer: (cls) => <Icon className={cls} path={<><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>} />,
  close: (cls) => <Icon className={cls} path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />,
  user: (cls) => <Icon className={cls} path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
  shield: (cls) => <Icon className={cls} path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} />,
  lock: (cls) => <Icon className={cls} path={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />,
  zap: (cls) => <Icon className={cls} path={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />} />,
  fileText: (cls) => <Icon className={cls} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>} />,
  percent: (cls) => <Icon className={cls} path={<><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>} />,
  globe: (cls) => <Icon className={cls} path={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />,
}

// ---------- Formatadores ----------
const maskCNPJ = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')

const maskCPF = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')

const maskDate = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')

const formatDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const formatBRL = (v) => {
  const n = Number(v)
  if (isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const formatCEP = (cep) => (cep ? cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') : '')
const formatPhone = (ddd, num) => (ddd && num ? `(${ddd}) ${num}` : '—')

// Converte a resposta do CNPJá para a mesma estrutura que a UI já usa (baseada no cnpj.ws)
function normalizeCnpja(d) {
  const c = d.company || {}
  const addr = d.address || {}
  const phone = (d.phones && d.phones[0]) || {}
  const regs = d.registrations || []
  return {
    _fonte: 'cnpja',
    razao_social: c.name,
    capital_social: c.equity,
    porte: { descricao: c.size?.text },
    natureza_juridica: { descricao: c.nature?.text },
    estabelecimento: {
      cnpj: d.taxId,
      nome_fantasia: d.alias,
      tipo: d.head ? 'Matriz' : 'Filial',
      situacao_cadastral: d.status?.text,
      data_situacao_cadastral: d.statusDate,
      data_inicio_atividade: d.founded,
      email: (d.emails && d.emails[0]?.address) || '',
      ddd1: phone.area,
      telefone1: phone.number,
      tipo_logradouro: '',
      logradouro: addr.street,
      numero: addr.number,
      complemento: addr.details,
      bairro: addr.district,
      cep: addr.zip,
      cidade: { nome: addr.city },
      estado: { sigla: addr.state },
      atividade_principal: d.mainActivity
        ? { subclasse: d.mainActivity.id, descricao: d.mainActivity.text }
        : undefined,
      atividades_secundarias: (d.sideActivities || []).map((a) => ({ subclasse: a.id, descricao: a.text })),
      inscricoes_estaduais: regs.map((r) => ({
        inscricao_estadual: r.number,
        estado: { sigla: r.state },
        ativo: r.enabled,
        _status_text: r.status?.text,
        _tipo: r.type?.text,
      })),
    },
    socios: (c.members || []).map((m) => ({
      nome: m.person?.name,
      qualificacao_socio: { descricao: m.role?.text },
    })),
    _simples: c.simples,
    _simei: c.simei,
    _raw: d,
  }
}

const prettyLabel = (key) =>
  key
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

// ---------- Acesso à API do backend ----------
const getKey = () => localStorage.getItem('access_key') || ''

async function api(path) {
  const res = await fetch(path, {
    headers: { 'x-access-key': getKey() },
    signal: AbortSignal.timeout(95000),
  }).catch((e) => {
    if (e?.name === 'TimeoutError' || /abort/i.test(String(e)))
      throw new Error('A consulta demorou demais para responder (o órgão de origem pode estar lento). Tente novamente.')
    throw new Error('Falha de conexão. Verifique sua internet e tente novamente.')
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { unauthorized: true })
  if (!res.ok) {
    const msg = [data.error || `Erro na consulta (HTTP ${res.status}).`, data.detail].filter(Boolean).join(' — ')
    throw new Error(msg)
  }
  return data
}

// ---------- Componentes genéricos ----------
function InfoCard({ icon, label, value, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 ${className}`}>
      <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon('w-5 h-5')}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function StatusBadge({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      {label}
    </span>
  )
}

const LABELS = {
  cnpj: 'CNPJ',
  cnpj_matriz: 'CNPJ Matriz',
  cpf: 'CPF',
  ie: 'Inscrição Estadual',
  nome_empresarial: 'Nome Empresarial',
  nome: 'Nome',
  fantasia: 'Nome Fantasia',
  situacao_simples_nacional: 'Situação Simples Nacional',
  situacao_simples_nacional_anterior: 'Simples Nacional (anterior)',
  situacao_simei: 'Situação SIMEI',
  situacao_simei_anterior: 'SIMEI (anterior)',
  eventos_futuros_simples_nacional: 'Eventos Futuros Simples Nacional',
  eventos_futuros_simples_simei: 'Eventos Futuros SIMEI',
  situacao_cadastral: 'Situação Cadastral',
  tipo_logradouro: 'Tipo de Logradouro',
  cep: 'CEP',
  uf: 'UF',
  municipio: 'Município',
  bairro: 'Bairro',
  logradouro: 'Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  telefone: 'Telefone',
  email: 'E-mail',
  data_abertura: 'Data de Abertura',
  atividade_economica: 'Atividade Econômica',
}

// Campos de controle interno que não interessam ao usuário
const IGNORE_KEYS = new Set([
  'code', 'status', 'message', 'version', '_cache', 'machine', 'return',
  'agendamentos', 'data-nascimento', 'token',
])
// Valores que representam "vazio" e devem ser ocultados
const isBlank = (v) => {
  const s = String(v).trim()
  return s === '' || s === '*******' || s === '********' || /^\*+$/.test(s) || s.toLowerCase() === 'null'
}

const applyLabel = (key) => LABELS[key] || prettyLabel(key)

// Renderiza qualquer resposta do SintegraWS como tabela chave-valor
function KVTable({ data }) {
  const scalars = []
  const complex = []
  Object.entries(data || {}).forEach(([k, v]) => {
    if (IGNORE_KEYS.has(k.toLowerCase())) return
    if (v === null || v === undefined) return
    if (typeof v === 'object') {
      if (Array.isArray(v) && v.length === 0) return
      complex.push([k, v])
    } else {
      if (isBlank(v)) return
      scalars.push([k, v])
    }
  })
  return (
    <div className="space-y-3">
      {scalars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {scalars.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm border-b border-slate-100 py-1.5">
              <span className="text-slate-500">{applyLabel(k)}</span>
              <span className="text-slate-900 font-medium text-right break-words">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
      {complex.map(([k, v]) => (
        <div key={k} className="border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{applyLabel(k)}</p>
          {Array.isArray(v) ? (
            <ul className="space-y-2">
              {v.map((item, i) => (
                <li key={i} className="bg-slate-50 rounded-lg p-2">
                  {typeof item === 'object' ? <KVTable data={item} /> : <span className="text-sm">{String(item)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <KVTable data={v} />
          )}
        </div>
      ))}
    </div>
  )
}

// Painel de uma consulta oficial (SintegraWS)
function OfficialPanel({ title, subtitle, icon, endpoint, disabled }) {
  const [state, setState] = useState({ loading: false, data: null, error: '' })
  const run = async () => {
    setState({ loading: true, data: null, error: '' })
    try {
      const data = await api(endpoint)
      if (data.code && data.code !== '0' && data.status !== 'OK') {
        setState({ loading: false, data: null, error: data.message || 'Consulta não retornou dados.' })
      } else {
        setState({ loading: false, data, error: '' })
      }
    } catch (e) {
      if (e.unauthorized) window.dispatchEvent(new Event('need-key'))
      setState({ loading: false, data: null, error: e.message === 'unauthorized' ? 'Informe a chave de acesso (cadeado no topo) para liberar as consultas pagas.' : e.message })
    }
  }
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            {icon('w-4 h-4')}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={state.loading || disabled}
          className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {state.loading ? 'Consultando...' : state.data ? 'Reconsultar' : 'Consultar'}
        </button>
      </div>
      {state.error && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-t border-red-100">{state.error}</div>
      )}
      {state.data && (
        <div className="px-4 py-4 border-t border-slate-200">
          {state.data._cache && (
            <p className="text-xs text-slate-400 mb-2">Resultado em cache (não consumiu crédito)</p>
          )}
          <KVTable data={state.data} />
        </div>
      )}
    </div>
  )
}

// ---------- Cartão CNPJ (impressão) ----------
function Campo({ label, value, className = '' }) {
  return (
    <div className={`border border-slate-300 rounded px-3 py-2 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 break-words">{value || '—'}</p>
    </div>
  )
}

function CartaoCNPJ({ data, endereco, onClose }) {
  const est = data.estabelecimento
  const hoje = new Date().toLocaleDateString('pt-BR')
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center overflow-y-auto p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-6 print:my-0 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 print:hidden">
          <h3 className="font-semibold text-slate-900">Cartão CNPJ</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {icons.printer('w-4 h-4')}
              Exportar PDF
            </button>
            <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              {icons.close('w-5 h-5')}
            </button>
          </div>
        </div>

        <div id="cartao-print" className="p-8 print:p-0">
          <div className="border-2 border-slate-800 rounded-lg p-6 space-y-4">
            <div className="text-center border-b border-slate-300 pb-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Cartão CNPJ</p>
              <p className="text-lg font-bold text-slate-900">Ficha Cadastral da Pessoa Jurídica</p>
              <p className="text-xs text-slate-500 mt-1">Emitido em {hoje} • Fonte: dados públicos (publica.cnpj.ws)</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Campo label="Número de inscrição" value={maskCNPJ(est?.cnpj ?? '')} />
              <Campo label="Data de abertura" value={formatDate(est?.data_inicio_atividade)} />
              <Campo label="Matriz / Filial" value={est?.tipo} />
              <Campo label="Nome empresarial" value={data.razao_social} className="col-span-3" />
              <Campo label="Título do estabelecimento (nome fantasia)" value={est?.nome_fantasia} className="col-span-2" />
              <Campo label="Porte" value={data.porte?.descricao} />
              <Campo
                label="Atividade econômica principal"
                value={
                  est?.atividade_principal
                    ? `${est.atividade_principal.subclasse ?? est.atividade_principal.id ?? ''} — ${est.atividade_principal.descricao}`
                    : est?.cnae_fiscal_descricao
                }
                className="col-span-3"
              />
              {est?.atividades_secundarias?.length > 0 && (
                <div className="col-span-3 border border-slate-300 rounded px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Atividades econômicas secundárias</p>
                  <ul className="mt-1 space-y-0.5">
                    {est.atividades_secundarias.map((a, i) => (
                      <li key={i} className="text-sm text-slate-900">
                        {(a.subclasse ?? a.id ?? '')} — {a.descricao}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Campo label="Natureza jurídica" value={data.natureza_juridica?.descricao} className="col-span-2" />
              <Campo label="Capital social" value={formatBRL(data.capital_social)} />
              <Campo label="Endereço" value={endereco} className="col-span-3" />
              <Campo label="Telefone" value={formatPhone(est?.ddd1, est?.telefone1)} />
              <Campo label="E-mail" value={est?.email} className="col-span-2" />
              <Campo label="Situação cadastral" value={est?.situacao_cadastral} />
              <Campo label="Data da situação cadastral" value={formatDate(est?.data_situacao_cadastral)} />
              <Campo label="Última atualização" value={formatDate(data.atualizado_em?.slice(0, 10))} />
              {est?.inscricoes_estaduais?.length > 0 && (
                <div className="col-span-3 border border-slate-300 rounded px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Inscrições estaduais</p>
                  <ul className="mt-1 space-y-0.5">
                    {est.inscricoes_estaduais.map((ie, i) => (
                      <li key={i} className="text-sm text-slate-900">
                        {ie.estado?.sigla ?? '—'} — IE {ie.inscricao_estadual} —{' '}
                        <span className={ie.ativo ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {ie.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {data.socios?.length > 0 && (
              <div className="border border-slate-300 rounded px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quadro societário</p>
                <ul className="mt-1 space-y-0.5">
                  {data.socios.map((s, i) => (
                    <li key={i} className="text-sm text-slate-900">
                      {s.nome} — {s.qualificacao_socio?.descricao}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-slate-500 border-t border-slate-300 pt-3">
              Documento informativo gerado a partir de dados públicos. Não substitui os comprovantes oficiais emitidos
              pela Receita Federal, Sefaz estaduais ou Suframa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Skeleton ----------
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="h-7 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Aba CNPJ ----------
function TabCNPJ() {
  const [input, setInput] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jsonOpen, setJsonOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)

  const consultar = async () => {
    const digits = input.replace(/\D/g, '')
    setError('')
    if (digits.length !== 14) {
      setError('CNPJ inválido. Digite os 14 dígitos no formato 00.000.000/0000-00.')
      return
    }
    setLoading(true)
    setData(null)
    setJsonOpen(false)
    setCardOpen(false)
    try {
      // Fonte principal: CNPJá (traz cadastral + inscrições estaduais + Simples numa só chamada).
      // Se não estiver configurado/autorizado, cai para a base pública gratuita.
      let usouCnpja = false
      try {
        const r = await fetch(
          `/api/cnpja/office?cnpj=${digits}&simples=true&registrations=ALL`,
          { headers: { 'x-access-key': getKey() } }
        )
        if (r.ok) {
          const d = await r.json()
          if (d && d.taxId) {
            setData(normalizeCnpja(d))
            usouCnpja = true
          }
        }
        // 401 (sem chave) ou 500 (token ausente) => silenciosamente usa a base pública
      } catch {
        /* usa fallback */
      }

      if (!usouCnpja) {
        const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`)
        if (res.status === 400) {
          setError('CNPJ inválido (dígito verificador não confere). Revise o número digitado.')
          return
        }
        if (res.status === 404) {
          setError('CNPJ não encontrado na base da Receita Federal. Verifique o número e tente novamente.')
          return
        }
        if (res.status === 429) {
          setError('Limite de consultas gratuitas atingido (3/min). Aguarde alguns instantes e tente novamente.')
          return
        }
        if (!res.ok) {
          setError('Não foi possível consultar agora. Tente novamente em instantes.')
          return
        }
        setData(await res.json())
      }
    } catch {
      setError('Falha de conexão com o serviço de consulta. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const est = data?.estabelecimento
  const ativa = est?.situacao_cadastral?.toLowerCase() === 'ativa'
  const digits = est?.cnpj ?? ''
  const endereco = est
    ? [
        [est.tipo_logradouro, est.logradouro].filter(Boolean).join(' '),
        est.numero,
        est.complemento,
        est.bairro,
        `${est.cidade?.nome ?? ''} - ${est.estado?.sigla ?? ''}`,
        formatCEP(est.cep),
      ]
        .filter((p) => p && String(p).trim() && String(p).trim() !== '-')
        .join(', ')
    : ''

  return (
    <div>
      {/* Barra de busca */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.search('w-5 h-5')}</span>
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(maskCNPJ(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && !loading && consultar()}
            placeholder="00.000.000/0000-00"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={consultar}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <span className="shrink-0 mt-0.5">{icons.alert('w-5 h-5')}</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-20 text-slate-400">
          <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            {icons.building('w-7 h-7')}
          </div>
          <p>Digite um CNPJ acima para ver os dados completos.</p>
        </div>
      )}

      {loading && <Skeleton />}

      {data && !loading && (
        <div className="space-y-6">
          {/* Card principal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{data.razao_social}</h2>
                {est?.nome_fantasia && <p className="text-slate-500 mt-1">{est.nome_fantasia}</p>}
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <StatusBadge ok={ativa} label={est?.situacao_cadastral ?? 'Desconhecida'} />
                <button
                  onClick={() => setCardOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors self-start sm:self-end"
                >
                  {icons.card('w-4 h-4')}
                  Gerar Cartão CNPJ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard icon={icons.hash} label="CNPJ" value={maskCNPJ(digits)} />
              <InfoCard icon={icons.scale} label="Porte" value={data.porte?.descricao} />
              <InfoCard icon={icons.calendar} label="Data de abertura" value={formatDate(est?.data_inicio_atividade)} />
              <InfoCard icon={icons.briefcase} label="Natureza jurídica" value={data.natureza_juridica?.descricao} />
              <InfoCard icon={icons.money} label="Capital social" value={formatBRL(data.capital_social)} />
              <InfoCard
                icon={icons.activity}
                label="Atividade principal"
                value={est?.atividade_principal?.descricao ?? est?.cnae_fiscal_descricao}
              />
              <InfoCard icon={icons.mapPin} label="Endereço" value={endereco} className="sm:col-span-2" />
              <InfoCard icon={icons.phone} label="Telefone" value={formatPhone(est?.ddd1, est?.telefone1)} />
              <InfoCard icon={icons.mail} label="E-mail" value={est?.email} className="sm:col-span-2 lg:col-span-3" />
            </div>
          </div>

          {/* Inscrições estaduais (base pública) */}
          {est?.inscricoes_estaduais?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <span className="text-blue-600">{icons.card('w-5 h-5')}</span>
                Inscrições estaduais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {est.inscricoes_estaduais.map((ie, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {ie.estado?.sigla ?? '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Inscrição estadual</p>
                        <p className="text-sm font-medium text-slate-800 truncate">{ie.inscricao_estadual}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        ie.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${ie.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {ie.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {data._fonte === 'cnpja'
                  ? 'Número, UF e situação das inscrições estaduais via Cadastro Centralizado de Contribuintes (CCC/CNPJá).'
                  : 'Status conforme base pública. Para a situação detalhada em tempo real, use a consulta SINTEGRA abaixo.'}
              </p>
            </div>
          )}

          {/* Simples Nacional / SIMEI — já vem na consulta CNPJá */}
          {data._fonte === 'cnpja' && (data._simples || data._simei) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <span className="text-blue-600">{icons.percent('w-5 h-5')}</span>
                Regime tributário
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Simples Nacional</p>
                    <p className="text-sm font-medium text-slate-800">
                      {data._simples?.optant ? 'Optante' : 'Não optante'}
                      {data._simples?.since ? ` desde ${formatDate(data._simples.since)}` : ''}
                    </p>
                  </div>
                  <StatusBadge ok={!!data._simples?.optant} label={data._simples?.optant ? 'Sim' : 'Não'} />
                </div>
                <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">MEI (SIMEI)</p>
                    <p className="text-sm font-medium text-slate-800">
                      {data._simei?.optant ? 'Enquadrado como MEI' : 'Não é MEI'}
                      {data._simei?.since ? ` desde ${formatDate(data._simei.since)}` : ''}
                    </p>
                  </div>
                  <StatusBadge ok={!!data._simei?.optant} label={data._simei?.optant ? 'MEI' : 'Não'} />
                </div>
              </div>
            </div>
          )}

          {/* Consultas oficiais avançadas (SintegraWS — opcional/complementar) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-1">
              <span className="text-blue-600">{icons.shield('w-5 h-5')}</span>
              Consultas complementares em tempo real
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {data._fonte === 'cnpja'
                ? 'Os dados acima já vêm do CNPJá. Use os botões abaixo (via SintegraWS) apenas se precisar do espelho em tempo real direto do órgão.'
                : 'Via SintegraWS — cada consulta consome créditos do pacote contratado. Resultados repetidos em até 24h vêm do cache sem custo.'}
            </p>
            <div className="space-y-3">
              <OfficialPanel
                title="SINTEGRA — Inscrição Estadual"
                subtitle="Situação detalhada da IE na Sefaz (habilitada, inapta, cancelada...)"
                icon={icons.card}
                endpoint={`/api/sws/sintegra?cnpj=${digits}`}
                disabled={!digits}
              />
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-1">
                Atenção: a consulta SINTEGRA de São Paulo é instável, pois a Sefaz-SP não integra o convênio nacional
                (o dado sai do CADESP, que restringe acesso automatizado). Para empresas de SP, o status da IE já
                aparece na seção "Inscrições estaduais" acima.
              </p>
              <OfficialPanel
                title="Suframa"
                subtitle="Inscrição e situação na Zona Franca de Manaus"
                icon={icons.globe}
                endpoint={`/api/sws/suframa?cnpj=${digits}`}
                disabled={!digits}
              />
            </div>
          </div>

          {/* Atividades secundárias */}
          {est?.atividades_secundarias?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <span className="text-blue-600">{icons.layers('w-5 h-5')}</span>
                Atividades secundárias
              </h3>
              <ul className="space-y-2">
                {est.atividades_secundarias.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <span className="shrink-0 text-xs font-mono font-semibold text-blue-600 bg-blue-50 rounded px-2 py-1">
                      {a.subclasse ?? a.id ?? '—'}
                    </span>
                    <span className="text-sm text-slate-700">{a.descricao}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quadro societário */}
          {data.socios?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <span className="text-blue-600">{icons.users('w-5 h-5')}</span>
                Quadro societário
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.socios.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {(s.nome ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.nome}</p>
                      <p className="text-xs text-slate-500">{s.qualificacao_socio?.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON completo */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setJsonOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className="text-blue-600">{icons.code('w-5 h-5')}</span>
                Ver estrutura de dados completa (JSON)
              </span>
              <span className={`text-slate-400 transition-transform ${jsonOpen ? 'rotate-180' : ''}`}>
                {icons.chevron('w-5 h-5')}
              </span>
            </button>
            {jsonOpen && (
              <pre className="bg-slate-900 text-green-400 text-xs p-5 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {cardOpen && data && <CartaoCNPJ data={data} endereco={endereco} onClose={() => setCardOpen(false)} />}
    </div>
  )
}

// ---------- Aba CPF ----------
function TabCPF() {
  const [cpf, setCpf] = useState('')
  const [nasc, setNasc] = useState('')
  const [state, setState] = useState({ loading: false, data: null, error: '' })

  const consultar = async () => {
    const c = cpf.replace(/\D/g, '')
    const n = nasc.replace(/\D/g, '')
    if (c.length !== 11) return setState({ loading: false, data: null, error: 'CPF inválido. Digite os 11 dígitos.' })
    if (n.length !== 8) return setState({ loading: false, data: null, error: 'Informe a data de nascimento completa (dd/mm/aaaa).' })
    setState({ loading: true, data: null, error: '' })
    try {
      const data = await api(`/api/sws/cpf?cpf=${c}&nascimento=${n}`)
      if (data.code && data.code !== '0' && data.status !== 'OK') {
        setState({ loading: false, data: null, error: data.message || 'Consulta não retornou dados. Confira CPF e data de nascimento.' })
      } else {
        setState({ loading: false, data, error: '' })
      }
    } catch (e) {
      if (e.unauthorized) window.dispatchEvent(new Event('need-key'))
      setState({ loading: false, data: null, error: e.message === 'unauthorized' ? 'Informe a chave de acesso (cadeado no topo) para liberar as consultas pagas.' : e.message })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.user('w-5 h-5')}</span>
          <input
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative sm:w-56">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.calendar('w-5 h-5')}</span>
          <input
            type="text"
            inputMode="numeric"
            value={nasc}
            onChange={(e) => setNasc(maskDate(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && !state.loading && consultar()}
            placeholder="Nascimento dd/mm/aaaa"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={consultar}
          disabled={state.loading}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {state.loading ? 'Consultando...' : 'Consultar'}
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Consulta da situação cadastral do CPF na Receita Federal via SintegraWS (consome 1 crédito). A data de
        nascimento é exigida pela própria Receita. Use apenas com autorização do titular, conforme a LGPD.
      </p>

      {state.error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <span className="shrink-0 mt-0.5">{icons.alert('w-5 h-5')}</span>
          <p className="text-sm">{state.error}</p>
        </div>
      )}

      {!state.data && !state.loading && !state.error && (
        <div className="text-center py-20 text-slate-400">
          <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            {icons.user('w-7 h-7')}
          </div>
          <p>Digite um CPF e a data de nascimento para consultar a situação cadastral.</p>
        </div>
      )}

      {state.loading && <Skeleton />}

      {state.data && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Situação cadastral do CPF</h3>
            {state.data.situacao_cadastral && (
              <StatusBadge
                ok={/regular/i.test(state.data.situacao_cadastral)}
                label={state.data.situacao_cadastral}
              />
            )}
          </div>
          {state.data._cache && <p className="text-xs text-slate-400 mb-2">Resultado em cache (não consumiu crédito)</p>}
          <KVTable data={state.data} />
        </div>
      )}
    </div>
  )
}

// ---------- Modal de chave (pedido só nas consultas pagas) ----------
function KeyModal({ onSave, onClose }) {
  const [key, setKey] = useState(getKey())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const salvar = async () => {
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/verify', { headers: { 'x-access-key': key } })
      if (res.ok) {
        localStorage.setItem('access_key', key)
        onSave()
      } else {
        setError('Chave de acesso incorreta.')
      }
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            {icons.lock('w-5 h-5')}
          </span>
          <h3 className="font-semibold text-slate-900">Chave de acesso</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          As consultas oficiais consomem créditos pagos. Informe a chave definida pelo administrador para liberá-las.
          A consulta cadastral do CNPJ continua livre.
        </p>
        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.lock('w-5 h-5')}</span>
          <input
            type="password"
            value={key}
            autoFocus
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && salvar()}
            placeholder="Chave de acesso"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Verificando...' : 'Liberar consultas'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- App ----------
export default function App() {
  const [tab, setTab] = useState('cnpj')
  const [keyOpen, setKeyOpen] = useState(false)

  useEffect(() => {
    const open = () => setKeyOpen(true)
    window.addEventListener('need-key', open)
    return () => window.removeEventListener('need-key', open)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              {icons.shield('w-5 h-5')}
            </span>
            <span className="font-bold text-slate-900">Central de Consultas Fiscais</span>
          </div>
          <button
            onClick={() => setKeyOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Chave de acesso das consultas pagas"
          >
            {icons.lock('w-5 h-5')}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Consulta completa CNPJ</h1>
          <p className="text-slate-500 mt-2">
            Dados cadastrais, societários e fiscais em um único lugar (Use com responsabilidade e ética)
          </p>
        </header>

        {/* Abas */}
        <div className="flex gap-2 mb-6 bg-white border border-slate-200 rounded-xl p-1.5 w-fit mx-auto">
          {[
            { id: 'cnpj', label: 'Consulta CNPJ', icon: icons.building },
            { id: 'cpf', label: 'Consulta CPF', icon: icons.user },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.icon('w-4 h-4')}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'cnpj' ? <TabCNPJ /> : <TabCPF />}

        <footer className="text-center text-xs text-slate-400 mt-12 pb-8">
          Dados públicos: publica.cnpj.ws • Consultas oficiais: SintegraWS • Documentos gerados não substituem os
          comprovantes oficiais dos órgãos emissores.
        </footer>
      </div>

      {keyOpen && <KeyModal onSave={() => setKeyOpen(false)} onClose={() => setKeyOpen(false)} />}
    </div>
  )
}
