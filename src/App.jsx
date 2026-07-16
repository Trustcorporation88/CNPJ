import { useState } from 'react'

// ---------- Ícones (SVG inline) ----------
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const icons = {
  search: <Icon path={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>} />,
  alert: <Icon path={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />,
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

// ---------- Componentes ----------
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

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
        {/* Barra de ações (não sai no PDF) */}
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
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {icons.close('w-5 h-5')}
            </button>
          </div>
        </div>

        {/* Área impressa */}
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Atividades econômicas secundárias
                  </p>
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
              Documento informativo gerado a partir de dados públicos da Receita Federal. Não substitui o
              Comprovante de Inscrição e de Situação Cadastral oficial, disponível no site da Receita Federal do Brasil.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
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
      setError('CNPJ inv00e1lido. Digite os 14 dígitos no formato 00.000.000/0000-00.')
      return
    }
    setLoading(true)
    setData(null)
    setJsonOpen(false)
    setCardOpen(false)
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`)
      if (res.status === 404) {
        setError('CNPJ não encontrado na base da Receita Federal. Verifique o número e tente novamente.')
        return
      }
      if (res.status === 429) {
        setError('Limite de consultas atingido. Aguarde alguns instantes e tente novamente.')
        return
      }
      if (!res.ok) {
        setError('Não foi possível consultar agora. Tente novamente em instantes.')
        return
      }
      setData(await res.json())
    } catch {
      setError('Falha de conexão com o serviço de consulta. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const est = data?.estabelecimento
  const ativa = est?.situacao_cadastral?.toLowerCase() === 'ativa'
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Consulta completa CNPJ</h1>
          <p className="text-slate-500 mt-2">
            Dados cadastrais, societários e fiscais em um único lugar (Use com responsabilidade e ética)
          </p>
        </header>

        {/* Barra de busca */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.search}</span>
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

        {/* Erro */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <span className="shrink-0 mt-0.5">{icons.alert}</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Estado inicial */}
        {!data && !loading && !error && (
          <div className="text-center py-20 text-slate-400">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              {icons.building('w-7 h-7')}
            </div>
            <p>Digite um CNPJ acima para ver os dados completos.</p>
          </div>
        )}

        {/* Loading */}
        {loading && <Skeleton />}

        {/* Resultado */}
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
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium self-start sm:self-end ${
                      ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${ativa ? 'bg-green-500' : 'bg-red-500'}`} />
                    {est?.situacao_cadastral ?? 'Desconhecida'}
                  </span>
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
                <InfoCard icon={icons.hash} label="CNPJ" value={maskCNPJ(est?.cnpj ?? data.cnpj_raiz ?? '')} />
                <InfoCard icon={icons.scale} label="Porte" value={data.porte?.descricao} />
                <InfoCard icon={icons.calendar} label="Data de abertura" value={formatDate(est?.data_inicio_atividade)} />
                <InfoCard icon={icons.briefcase} label="Natureza jurídica" value={data.natureza_juridica?.descricao} />
                <InfoCard icon={icons.money} label="Capital social" value={formatBRL(data.capital_social)} />
                <InfoCard
                  icon={icons.activity}
                  label="Atividade principal"
                  value={est?.atividade_principal?.descricao ?? est?.cnae_fiscal_descricao}
                />
                <InfoCard
                  icon={icons.mapPin}
                  label="Endereço"
                  value={endereco}
                  className="sm:col-span-2"
                />
                <InfoCard icon={icons.phone} label="Telefone" value={formatPhone(est?.ddd1, est?.telefone1)} />
                <InfoCard icon={icons.mail} label="E-mail" value={est?.email} className="sm:col-span-2 lg:col-span-3" />
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
                    <li
                      key={a.id ?? i}
                      className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                    >
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

        {cardOpen && data && (
          <CartaoCNPJ data={data} endereco={endereco} onClose={() => setCardOpen(false)} />
        )}
      </div>
    </div>
  )
}
