// app/projetos/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

const TIPO_LABEL: Record<string, string> = {
  islmbp:  'IS-LM-BP',
  oa_da:   'OA-DA',
  funcao:  'Funcoes',
  custom:  'Modelo Proprio',
}

const TIPO_COR: Record<string, string> = {
  islmbp:  'bg-blue-50 text-oikos-blue',
  oa_da:   'bg-green-50 text-oikos-green',
  funcao:  'bg-purple-50 text-oikos-purple',
  custom:  'bg-orange-50 text-orange-600',
}

export default async function ProjetosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Dashboard</Link>
          <Link href="/perfil" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Perfil</Link>
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-sm text-oikos-muted hover:text-red-500 transition-colors">Sair</button>
          </form>
        </nav>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-7xl mx-auto">

        {/* TITULO */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-1">Plataforma</p>
            <h1 className="text-4xl font-bold text-oikos-text tracking-tight">Meus Projetos</h1>
          </div>
          <Link href="/projetos/novo"
            className="bg-oikos-blue text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Novo Projeto
          </Link>
        </div>

        {/* LISTA */}
        {projetos && projetos.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {projetos.map((p: Projeto) => (
              <Link key={p.id} href={`/projetos/${p.id}`}
                className="bg-oikos-surface border border-oikos-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all block group">

                {/* Header do card */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${TIPO_COR[p.tipo] || 'bg-gray-100 text-oikos-muted'}`}>
                    {TIPO_LABEL[p.tipo] || p.tipo}
                  </span>
                  {p.publico && (
                    <span className="text-xs font-medium text-oikos-green">Publico</span>
                  )}
                </div>

                {/* Titulo */}
                <h3 className="text-base font-semibold text-oikos-text mb-2 group-hover:text-oikos-blue transition-colors">
                  {p.titulo}
                </h3>

                {/* Descricao */}
                {p.descricao && (
                  <p className="text-sm text-oikos-muted leading-relaxed mb-4 line-clamp-2">
                    {p.descricao}
                  </p>
                )}

                {/* Footer do card */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-oikos-border">
                  <span className="text-xs text-oikos-muted">
                    {new Date(p.updated_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span className="text-xs font-medium text-oikos-blue">Abrir</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 rounded-lg bg-oikos-blue opacity-20" />
            </div>
            <h3 className="text-lg font-semibold text-oikos-text mb-2">Nenhum projeto ainda</h3>
            <p className="text-sm text-oikos-muted mb-6 max-w-sm mx-auto">
              Crie seu primeiro projeto para comecar a usar o laboratorio economico.
            </p>
            <Link href="/projetos/novo"
              className="inline-block bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Criar primeiro projeto
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}