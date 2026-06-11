import Link from 'next/link'

const ARTIGOS = [
  {
    id: 1,
    titulo: 'O que é o modelo IS-LM e por que ele ainda importa?',
    resumo: 'O modelo IS-LM continua sendo uma das ferramentas mais usadas na macroeconomia moderna. Entenda como ele funciona e suas limitações.',
    categoria: 'Macroeconomia',
    data: '2026-06-01',
    leitura: '5 min',
    cor: 'border-blue-500/30 bg-blue-500/5',
    tagCor: 'bg-blue-500/20 text-blue-300',
  },
  {
    id: 2,
    titulo: 'Escolas de pensamento econômico: um guia completo',
    resumo: 'Da escola clássica ao pós-keynesianismo, entenda as principais correntes do pensamento econômico e suas diferenças fundamentais.',
    categoria: 'Teoria Econômica',
    data: '2026-05-28',
    leitura: '8 min',
    cor: 'border-purple-500/30 bg-purple-500/5',
    tagCor: 'bg-purple-500/20 text-purple-300',
  },
  {
    id: 3,
    titulo: 'Política fiscal vs política monetária: quando usar cada uma?',
    resumo: 'Uma análise comparativa dos instrumentos de política econômica e suas aplicações em diferentes contextos macroeconômicos.',
    categoria: 'Política Econômica',
    data: '2026-05-20',
    leitura: '6 min',
    cor: 'border-green-500/30 bg-green-500/5',
    tagCor: 'bg-green-500/20 text-green-300',
  },
  {
    id: 4,
    titulo: 'Economia brasileira em dados: 2020-2025',
    resumo: 'Uma análise dos principais indicadores econômicos do Brasil nos últimos 5 anos, com foco em PIB, inflação e desemprego.',
    categoria: 'Economia Brasileira',
    data: '2026-05-15',
    leitura: '10 min',
    cor: 'border-cyan-500/30 bg-cyan-500/5',
    tagCor: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    id: 5,
    titulo: 'O multiplicador keynesiano: teoria e aplicações',
    resumo: 'Como pequenas variações nos gastos autônomos geram efeitos amplificados no produto? Entenda o mecanismo do multiplicador.',
    categoria: 'Macroeconomia',
    data: '2026-05-10',
    leitura: '7 min',
    cor: 'border-orange-500/30 bg-orange-500/5',
    tagCor: 'bg-orange-500/20 text-orange-300',
  },
  {
    id: 6,
    titulo: 'Mundell-Fleming e a trindade impossível',
    resumo: 'Por que um país não pode ter simultaneamente câmbio fixo, livre mobilidade de capital e política monetária independente?',
    categoria: 'Economia Aberta',
    data: '2026-05-05',
    leitura: '9 min',
    cor: 'border-indigo-500/30 bg-indigo-500/5',
    tagCor: 'bg-indigo-500/20 text-indigo-300',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex">

      {/* SIDEBAR */}
      <aside className="w-60 fixed left-0 top-0 h-full bg-white/3 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo-oikoslab.png" alt="OikosLab" className="h-7 object-contain" />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          {[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Projetos',        href: '/projetos' },
            { label: 'Novo Projeto',    href: '/projetos/novo' },
            { label: 'Blog Econômico',  href: '/blog', ativo: true },
            { label: 'Laboratório',     href: '#', externo: true },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${item.ativo ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link href="/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">M</div>
            <p className="text-sm font-medium text-white">Perfil</p>
          </Link>
        </div>
      </aside>

      {/* CONTEUDO */}
      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
          <h1 className="text-lg font-semibold">Blog Econômico</h1>
          <p className="text-xs text-gray-500">Artigos, análises e teoria econômica</p>
        </header>

        <div className="px-8 py-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-5">
            {ARTIGOS.map(a => (
              <div key={a.id} className={`border rounded-2xl p-6 ${a.cor} hover:bg-white/10 transition cursor-pointer group`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${a.tagCor}`}>{a.categoria}</span>
                  <span className="text-xs text-gray-500">{a.leitura} de leitura</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-blue-300 transition leading-snug">
                  {a.titulo}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-2">{a.resumo}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {new Date(a.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-blue-400 group-hover:underline">Ler artigo →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
