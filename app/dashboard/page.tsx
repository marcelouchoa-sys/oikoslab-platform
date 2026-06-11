// app/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const nome =
    user.user_metadata?.nome ||
    user.email?.split('@')[0] ||
    'Usuario'

  const hora = new Date().getHours()
  const saudacao =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(4)

  const { data: compartilhados } = await supabase
    .from('compartilhamentos')
    .select('projeto_id, permissao, projetos(*)')
    .eq('shared_with_id', user.id)
    .limit(4)

  const KpiCard = ({ label, value }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-xl hover:bg-white/10 transition">
      <p className="text-white/50 text-sm">{label}</p>
      <h2 className="text-2xl font-semibold mt-1">{value}</h2>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex">

      {/* SIDEBAR */}
      <aside className="w-64 fixed left-0 top-0 h-full bg-white/5 border-r border-white/10 backdrop-blur-xl p-4">
        <div className="text-xl font-bold mb-10 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          OikosLab
        </div>

        <nav className="space-y-1 text-sm">
          {[
            'Dashboard',
            'Projetos',
            'Novo Projeto',
            'Laboratório',
            'Perfil',
          ].map((item) => (
            <a
              key={item}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 transition"
            >
              {item}
            </a>
          ))}

          <form action="/auth/logout" method="POST">
            <button className="mt-6 w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg">
              Sair
            </button>
          </form>
        </nav>
      </aside>

      {/* CONTEUDO */}
      <div className="flex-1 ml-64">

        {/* HEADER */}
        <header className="fixed top-0 left-64 right-0 z-50 px-10 py-6 border-b border-white/10 bg-[#0b0f19]/70 backdrop-blur-xl">
          <h1 className="text-xl font-semibold">
            {saudacao}, {nome}
          </h1>
          <p className="text-white/50 text-sm">
            Bem-vindo ao seu laboratório econômico
          </p>
        </header>

        {/* BODY */}
        <div className="pt-28 px-10 pb-16 max-w-7xl mx-auto space-y-10">

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard label="Projetos Totais" value={projetos?.length || 0} />
            <KpiCard label="Compartilhados" value={compartilhados?.length || 0} />
            <KpiCard label="Última Atividade" value="Hoje" />
            <KpiCard label="Modelos Criados" value="7" />
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* PROJETOS */}
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  Projetos recentes
                </h3>

                <Link
                  href="/projetos"
                  className="text-xs text-cyan-300 hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              {projetos && projetos.length > 0 ? (
                <div className="space-y-3">
                  {projetos.map((p: Projeto) => (
                    <Link
                      key={p.id}
                      href={`/projetos/${p.id}`}
                      className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold">
                            {p.titulo}
                          </p>
                          <p className="text-xs text-white/50">
                            {p.tipo} ·{' '}
                            {new Date(
                              p.updated_at
                            ).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        {p.publico && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-300">
                            Público
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-white/40">
                  Nenhum projeto ainda
                </div>
              )}
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">
                Ações rápidas
              </h3>

              <div className="space-y-2">
                <Link
                  href="/projetos/novo"
                  className="block p-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition"
                >
                  + Novo Projeto
                </Link>

                <Link
                  href="/laboratorio"
                  className="block p-3 rounded-lg hover:bg-white/10 transition"
                >
                  🧪 Laboratório Didático
                </Link>

                <Link
                  href="/projetos"
                  className="block p-3 rounded-lg hover:bg-white/10 transition"
                >
                  📂 Meus Projetos
                </Link>
              </div>
            </div>
          </div>

          {/* COMPARTILHADOS */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">
              Compartilhados comigo
            </h3>

            {compartilhados && compartilhados.length > 0 ? (
              <div className="space-y-3">
                {compartilhados.map((c: any) => (
                  <Link
                    key={c.projeto_id}
                    href={`/projetos/${c.projeto_id}`}
                    className="block p-3 rounded-lg hover:bg-white/10 border border-white/10 transition"
                  >
                    <p className="text-sm font-medium">
                      {c.projetos?.titulo || 'Projeto'}
                    </p>
                    <p className="text-xs text-white/50 capitalize">
                      {c.permissao}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">
                Nenhum projeto compartilhado ainda
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}