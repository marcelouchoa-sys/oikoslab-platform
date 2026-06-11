import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

const TIPO_LABEL: Record<string, string> = {
  islmbp: 'IS-LM-BP',
  oa_da: 'OA-DA',
  funcao: 'Funções',
  custom: 'Modelo Próprio',
  economia_real: 'Economia Real',
}

const TIPO_COR: Record<string, string> = {
  islmbp: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  oa_da: 'bg-green-500/20 text-green-300 border-green-500/20',
  funcao: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  custom: 'bg-orange-500/20 text-orange-300 border-orange-500/20',
  economia_real: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
}

const TIPO_BORDA: Record<string, string> = {
  islmbp: 'border-t-blue-500/50',
  oa_da: 'border-t-green-500/50',
  funcao: 'border-t-purple-500/50',
  custom: 'border-t-orange-500/50',
  economia_real: 'border-t-cyan-500/50',
}

export default async function ProjetosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario'
  const inicial = nome[0].toUpperCase()

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const total = projetos?.length || 0
  const porTipo = projetos?.reduce((acc: any, p) => {
    acc[p.tipo] = (acc[p.tipo] || 0) + 1
    return acc
  }, {}) || {}

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
            { label: 'Dashboard',      href: '/dashboard' },
            { label: 'Projetos',       href: '/projetos', ativo: true },
            { label: 'Novo Projeto',   href: '/projetos/novo' },
            { label: 'Blog Econômico', href: '/blog' },
            { label: 'Laboratório',    href: process.env.NEXT_PUBLIC_LAB_URL || '#', externo: true },
          ].map(item => (
            item.externo ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
                {item.label}
              </a>
            ) : (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${(item as any).ativo ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
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
            <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition">Sair</button>
          </form>
        </div>
      </aside>

      {/* CONTEUDO */}
      <div className="flex-1 ml-60">

        {/* HEADER */}
        <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Meus Projetos</h1>
            <p className="text-xs text-gray-500">{total} projeto{total !== 1 ? 's' : ''} no total</p>
          </div>
          <Link href="/projetos/novo"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition">
            + Novo Projeto
          </Link>
        </header>

        <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">

          {/* STATS POR TIPO */}
          {total > 0 && (
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-gray-400">Total: </span>
                <span className="font-semibold text-white">{total}</span>
              </div>
              {Object.entries(porTipo).map(([tipo, qtd]: any) => (
                <div key={tipo} className={`border rounded-xl px-4 py-2.5 text-sm ${TIPO_COR[tipo] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                  {TIPO_LABEL[tipo] || tipo}: <span className="font-semibold">{qtd}</span>
                </div>
              ))}
            </div>
          )}

          {/* GRID DE PROJETOS */}
          {projetos && projetos.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {projetos.map((p: Projeto) => (
                <Link key={p.id} href={`/projetos/${p.id}`}
                  className={`bg-white/5 border border-white/10 border-t-2 ${TIPO_BORDA[p.tipo] || 'border-t-gray-500/50'} rounded-2xl p-5 hover:bg-white/10 transition group flex flex-col`}>

                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TIPO_COR[p.tipo] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
                      {TIPO_LABEL[p.tipo] || p.tipo}
                    </span>
                    {p.publico && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        Público
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition leading-snug">
                    {p.titulo}
                  </h3>

                  {p.descricao && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
                      {p.descricao}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-600">
                      {new Date(p.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-blue-400 group-hover:underline">Abrir →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
              <p className="text-lg font-semibold text-white mb-2">Nenhum projeto ainda</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Crie seu primeiro projeto para começar a usar o laboratório econômico.
              </p>
              <Link href="/projetos/novo"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition">
                Criar primeiro projeto
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
