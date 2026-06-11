import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

const TIPO_LABEL: Record<string, string> = {
  simulador_completo: 'Simulador Completo',
  cenario_calibrado:  'Cenário Calibrado',
  construtor_funcoes: 'Construtor de Funções',
  islmbp: 'IS-LM-BP',
  oa_da: 'OA-DA',
  funcao: 'Funções',
  custom: 'Modelo Próprio',
  economia_real: 'Economia Real',
}

const TIPO_COR: Record<string, string> = {
  simulador_completo: 'bg-blue-500/20 text-blue-300',
  cenario_calibrado:  'bg-cyan-500/20 text-cyan-300',
  construtor_funcoes: 'bg-purple-500/20 text-purple-300',
  islmbp: 'bg-blue-500/20 text-blue-300',
  oa_da: 'bg-green-500/20 text-green-300',
  funcao: 'bg-purple-500/20 text-purple-300',
  custom: 'bg-orange-500/20 text-orange-300',
  economia_real: 'bg-cyan-500/20 text-cyan-300',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario'
  const inicial = nome[0].toUpperCase()
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const [
    { data: projetos, count: totalProjetos },
    { data: simulacoes, count: totalSimulacoes },
    { data: compartilhados },
    { count: totalPublicos },
  ] = await Promise.all([
    supabase.from('projetos').select('*', { count: 'exact' }).eq('user_id', user.id).order('updated_at', { ascending: false }).limit(5),
    supabase.from('simulacoes').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('compartilhamentos').select('projeto_id, permissao, projetos(*)').eq('shared_with_id', user.id).limit(3),
    supabase.from('projetos').select('*', { count: 'exact' }).eq('user_id', user.id).eq('publico', true),
  ])

  const destaque = projetos?.[0] || null

  const KPIS = [
    { label: 'Projetos', valor: totalProjetos || 0, cor: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', text: 'text-blue-400' },
    { label: 'Simulações', valor: totalSimulacoes || 0, cor: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', text: 'text-purple-400' },
    { label: 'Públicos', valor: totalPublicos || 0, cor: 'from-green-500/20 to-green-600/10 border-green-500/20', text: 'text-green-400' },
    { label: 'Compartilhados', valor: compartilhados?.length || 0, cor: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20', text: 'text-cyan-400' },
  ]

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex">

      {/* SIDEBAR */}
      <aside className="w-60 fixed left-0 top-0 h-full bg-white/3 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo-oikoslab.png" alt="OikosLab" className="h-7 object-contain" />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 text-sm overflow-y-auto">
          {[
            { label: 'Projetos',        href: '/projetos' },
            { label: 'Novo Projeto',    href: '/projetos/novo' },
            { label: 'Blog Econômico',  href: '/blog' },
            { label: 'Laboratório',     href: process.env.NEXT_PUBLIC_LAB_URL || '#', externo: true },
          ].map(item => (
            item.externo ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link href="/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {inicial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{nome}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </Link>
          <form action="/auth/logout" method="POST" className="mt-1">
            <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition">
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* CONTEUDO */}
      <div className="flex-1 ml-60 min-h-screen">

        {/* HEADER */}
        <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{saudacao}, {nome}</h1>
            <p className="text-xs text-gray-500">Bem-vindo ao seu laboratório econômico</p>
          </div>
          <Link href="/perfil" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold hover:opacity-90 transition">
            {inicial}
          </Link>
        </header>

        <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">

          {/* KPIS */}
          <div className="grid grid-cols-4 gap-4">
            {KPIS.map(k => (
              <div key={k.label} className={`bg-gradient-to-br ${k.cor} border rounded-2xl p-5 backdrop-blur-xl`}>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-2">{k.label}</p>
                <p className={`text-3xl font-bold ${k.text}`}>{k.valor}</p>
              </div>
            ))}
          </div>

          {/* DESTAQUE + ACESSO RAPIDO */}
          <div className="grid grid-cols-3 gap-6">

            {destaque && (
              <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Continuar de onde parou</p>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{destaque.titulo}</h3>
                    {destaque.descricao && <p className="text-gray-400 text-sm mb-3">{destaque.descricao}</p>}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${TIPO_COR[destaque.tipo] || 'bg-gray-500/20 text-gray-300'}`}>
                      {TIPO_LABEL[destaque.tipo] || destaque.tipo}
                    </span>
                  </div>
                  <Link href={`/projetos/${destaque.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex-shrink-0">
                    Continuar →
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Novo projeto</p>
              <div className="space-y-2">
                {[
                  { label: 'Modelo Próprio',    desc: 'Equações customizadas', cor: 'hover:border-orange-500/40', href: '/projetos/novo' },
                  { label: 'Economia Real',      desc: 'Dados do World Bank',   cor: 'hover:border-cyan-500/40',   href: '/projetos/novo' },
                  { label: 'Simulador Dinâmico', desc: 'Choques e políticas',   cor: 'hover:border-purple-500/40', href: '/projetos/novo' },
                ].map(a => (
                  <Link key={a.label} href={a.href}
                    className={`block p-3 rounded-xl border border-white/10 ${a.cor} transition group`}>
                    <p className="text-sm font-medium text-white group-hover:text-white">{a.label}</p>
                    <p className="text-xs text-gray-500">{a.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* PROJETOS RECENTES */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold">Projetos recentes</p>
              <Link href="/projetos" className="text-xs text-blue-400 hover:underline">Ver todos →</Link>
            </div>
            {projetos && projetos.length > 0 ? (
              <div className="space-y-2">
                {projetos.map((p: Projeto) => (
                  <Link key={p.id} href={`/projetos/${p.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition">{p.titulo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(p.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TIPO_COR[p.tipo] || 'bg-gray-500/20 text-gray-300'}`}>
                        {TIPO_LABEL[p.tipo] || p.tipo}
                      </span>
                      {p.publico && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-300">Público</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm mb-4">Nenhum projeto ainda</p>
                <Link href="/projetos/novo" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                  Criar primeiro projeto
                </Link>
              </div>
            )}
          </div>

          {/* SIMULACOES + COMPARTILHADOS */}
          <div className="grid grid-cols-2 gap-6">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm font-semibold mb-4">Simulações recentes</p>
              {simulacoes && simulacoes.length > 0 ? (
                <div className="space-y-2">
                  {simulacoes.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div>
                        <p className="text-xs font-medium text-white">{s.modulo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(s.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">salvo</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-6">Nenhuma simulação salva ainda</p>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm font-semibold mb-4">Compartilhados comigo</p>
              {compartilhados && compartilhados.length > 0 ? (
                <div className="space-y-2">
                  {compartilhados.map((c: any) => (
                    <Link key={c.projeto_id} href={`/projetos/${c.projeto_id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                      <p className="text-sm font-medium text-white">{c.projetos?.titulo || 'Projeto'}</p>
                      <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full capitalize">{c.permissao}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-6">Nenhum projeto compartilhado ainda</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
