// app/dashboard/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario'
  const inicial = nome[0].toUpperCase()

  // Buscar projetos recentes
  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(4)

  // Buscar projetos compartilhados
  const { data: compartilhados } = await supabase
    .from('compartilhamentos')
    .select('projeto_id, permissao, projetos(*)')
    .eq('shared_with_id', user.id)
    .limit(3)

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">
          OikosLab
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/projetos" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">
            Projetos
          </Link>
          <Link href="/perfil" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">
            Perfil
          </Link>
          <div className="flex items-center gap-3 pl-4 border-l border-oikos-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-oikos-blue to-oikos-purple flex items-center justify-center text-white text-sm font-bold">
              {inicial}
            </div>
            <span className="text-sm font-medium text-oikos-text">{nome}</span>
          </div>
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-sm text-oikos-muted hover:text-red-500 transition-colors">
              Sair
            </button>
          </form>
        </nav>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-7xl mx-auto">

        {/* BOAS VINDAS */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-oikos-text tracking-tight mb-2">
            {saudacao}, {nome}
          </h1>
          <p className="text-oikos-muted">Bem-vindo ao seu laboratorio de economia.</p>
        </div>

        {/* ACOES RAPIDAS */}
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-4">
            O que voce quer fazer?
          </p>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                titulo: 'Novo Projeto',
                desc: 'Crie uma analise economica do zero ou use um modelo pronto',
                cor: 'border-t-oikos-blue',
                href: '/projetos/novo',
                destaque: true,
              },
              {
                titulo: 'Meus Projetos',
                desc: 'Acesse e continue seus projetos salvos',
                cor: 'border-t-oikos-purple',
                href: '/projetos',
                destaque: false,
              },
              {
                titulo: 'Laboratorio Didatico',
                desc: 'Acesse os simuladores IS-LM-BP, Funcoes e Escolas',
                cor: 'border-t-oikos-green',
                href: process.env.NEXT_PUBLIC_LAB_URL || '#',
                destaque: false,
                externo: true,
              },
              {
                titulo: 'Projetos de Amigos',
                desc: 'Veja projetos compartilhados com voce',
                cor: 'border-t-oikos-slate',
                href: '/projetos/compartilhados',
                destaque: false,
              },
            ].map(a => (
              a.externo ? (
                <a key={a.titulo} href={a.href} target="_blank" rel="noopener noreferrer"
                  className={`bg-oikos-surface border border-oikos-border border-t-4 ${a.cor} rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 block`}>
                  <h3 className="text-base font-semibold text-oikos-text mb-1">{a.titulo}</h3>
                  <p className="text-sm text-oikos-muted leading-relaxed">{a.desc}</p>
                </a>
              ) : (
                <Link key={a.titulo} href={a.href}
                  className={`border border-t-4 ${a.cor} rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 block ${a.destaque ? 'bg-oikos-blue border-oikos-blue' : 'bg-oikos-surface border-oikos-border'}`}>
                  <h3 className={`text-base font-semibold mb-1 ${a.destaque ? 'text-white' : 'text-oikos-text'}`}>
                    {a.titulo}
                  </h3>
                  <p className={`text-sm leading-relaxed ${a.destaque ? 'text-blue-100' : 'text-oikos-muted'}`}>
                    {a.desc}
                  </p>
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">

          {/* PROJETOS RECENTES */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted">
                Projetos recentes
              </p>
              <Link href="/projetos" className="text-xs font-medium text-oikos-blue hover:underline">
                Ver todos
              </Link>
            </div>

            {projetos && projetos.length > 0 ? (
              <div className="space-y-3">
                {projetos.map((p: Projeto) => (
                  <Link key={p.id} href={`/projetos/${p.id}`}
                    className="bg-oikos-surface border border-oikos-border rounded-xl p-4 flex items-center justify-between hover:border-oikos-blue transition-colors block">
                    <div>
                      <p className="text-sm font-semibold text-oikos-text">{p.titulo}</p>
                      <p className="text-xs text-oikos-muted mt-0.5">
                        {p.tipo} · {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.publico && (
                        <span className="text-xs bg-green-50 text-oikos-green px-2 py-0.5 rounded-full font-medium">
                          Publico
                        </span>
                      )}
                      <span className="text-xs bg-blue-50 text-oikos-blue px-3 py-1 rounded-full font-medium">
                        Abrir
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-10 text-center">
                <p className="text-sm font-medium text-oikos-text mb-2">Nenhum projeto ainda</p>
                <p className="text-sm text-oikos-muted mb-4">
                  Crie seu primeiro projeto para comecar a usar o laboratorio.
                </p>
                <Link href="/projetos/novo"
                  className="inline-block bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Criar primeiro projeto
                </Link>
              </div>
            )}
          </div>

          {/* COMPARTILHADOS */}
          <div className="col-span-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-4">
              Compartilhados comigo
            </p>

            {compartilhados && compartilhados.length > 0 ? (
              <div className="space-y-3">
                {compartilhados.map((c: any) => (
                  <Link key={c.projeto_id} href={`/projetos/${c.projeto_id}`}
                    className="bg-oikos-surface border border-oikos-border rounded-xl p-4 hover:border-oikos-blue transition-colors block">
                    <p className="text-sm font-semibold text-oikos-text">
                      {c.projetos?.titulo || 'Projeto'}
                    </p>
                    <p className="text-xs text-oikos-muted mt-0.5 capitalize">{c.permissao}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-6 text-center">
                <p className="text-sm text-oikos-muted">
                  Nenhum projeto compartilhado ainda.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}