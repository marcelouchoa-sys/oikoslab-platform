'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TIPOS = [
  {
    id: 'simulador_completo',
    titulo: 'Simulador de Economia Completa',
    desc: 'Monte uma economia do zero: defina estrutura produtiva, políticas, setor externo e escola econômica. Analise equilíbrios e choques.',
    cor: 'border-t-blue-500/50',
    tag: 'Disponível',
    tagCor: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
    disponivel: true,
  },
  {
    id: 'cenario_calibrado',
    titulo: 'Cenários Pré-calibrados',
    desc: 'Economias reais parametrizadas: Brasil, Argentina, países em guerra, economias em desenvolvimento. Simule as mudanças que desejar.',
    cor: 'border-t-cyan-500/50',
    tag: 'Disponível',
    tagCor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
    disponivel: true,
  },
  {
    id: 'construtor_funcoes',
    titulo: 'Construtor de Funções',
    desc: 'Defina suas próprias equações econômicas e analise o comportamento do modelo resultante.',
    cor: 'border-t-purple-500/50',
    tag: 'Em breve',
    tagCor: 'bg-white/5 text-gray-500 border-white/10',
    disponivel: false,
  },
]

export default function NovoProjeto() {
  const [etapa, setEtapa] = useState<'tipo' | 'detalhes'>('tipo')
  const [tipoSel, setTipoSel] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [publico, setPublico] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function criar() {
    if (!titulo.trim()) return setErro('Digite um título para o projeto.')
    setLoading(true)
    setErro(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data, error } = await supabase
      .from('projetos')
      .insert({ user_id: user.id, titulo: titulo.trim(), descricao: descricao.trim() || null, tipo: tipoSel, publico, configuracao: {} })
      .select().single()
    if (error) { setErro('Erro ao criar projeto. Tente novamente.'); setLoading(false); return }
    router.push(`/projetos/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white flex">

      {/* SIDEBAR */}
      <aside className="w-60 fixed left-0 top-0 h-full bg-white/3 border-r border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/home" className="flex items-center">
            <img src="/logo-oikoslab.png" alt="OikosLab" className="h-7 object-contain" />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          {[
            { label: 'Dashboard',      href: '/dashboard' },
            { label: 'Projetos',       href: '/projetos' },
            { label: 'Novo Projeto',   href: '/projetos/novo', ativo: true },
            { label: 'Blog Econômico', href: '/blog' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${(item as any).ativo ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Novo Projeto</h1>
            <p className="text-xs text-gray-500">Escolha o tipo de análise</p>
          </div>
          <Link href="/projetos" className="text-sm text-gray-400 hover:text-white transition">Cancelar</Link>
        </header>

        <div className="px-8 py-10 max-w-4xl mx-auto">

          {/* PROGRESSO */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`flex items-center gap-2 text-sm font-medium ${etapa === 'tipo' ? 'text-blue-400' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'tipo' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-500'}`}>1</span>
              Tipo de projeto
            </div>
            <div className="h-px w-8 bg-white/10" />
            <div className={`flex items-center gap-2 text-sm font-medium ${etapa === 'detalhes' ? 'text-blue-400' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'detalhes' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-500'}`}>2</span>
              Detalhes
            </div>
          </div>

          {etapa === 'tipo' && (
            <>
              <div className="space-y-4 mb-8">
                {TIPOS.map(t => (
                  <button key={t.id} onClick={() => t.disponivel && setTipoSel(t.id)} disabled={!t.disponivel}
                    className={`w-full text-left bg-white/5 border border-t-2 ${t.cor} rounded-2xl p-6 transition-all ${
                      !t.disponivel ? 'opacity-40 cursor-not-allowed' :
                      tipoSel === t.id ? 'border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30' :
                      'border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-white">{t.titulo}</h3>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${t.tagCor}`}>
                            {t.tag}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{t.desc}</p>
                      </div>
                      {tipoSel === t.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ml-4 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => tipoSel && setEtapa('detalhes')} disabled={!tipoSel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed">
                Continuar →
              </button>
            </>
          )}

          {etapa === 'detalhes' && (
            <>
              <button onClick={() => setEtapa('tipo')} className="text-sm text-gray-400 hover:text-white mb-6 transition">
                ← Voltar
              </button>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tipo selecionado</p>
                  <p className="text-sm font-medium text-white">{TIPOS.find(t => t.id === tipoSel)?.titulo}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Título do projeto <span className="text-red-400">*</span></label>
                  <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                    placeholder="Ex: Análise do Plano Real, Economia Keynesiana..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Descrição <span className="text-gray-600 font-normal">(opcional)</span></label>
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                    placeholder="Descreva o objetivo do projeto..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="publico" checked={publico} onChange={e => setPublico(e.target.checked)}
                    className="w-4 h-4 accent-blue-500" />
                  <label htmlFor="publico" className="text-sm text-gray-300 cursor-pointer">
                    Tornar projeto público
                    <span className="text-gray-500 ml-1">(outros usuários poderão visualizar)</span>
                  </label>
                </div>
              </div>

              {erro && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/15 text-red-300 border border-red-500/20 text-sm">{erro}</div>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={criar} disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {loading ? 'Criando...' : 'Criar projeto'}
                </button>
                <Link href="/projetos" className="bg-white/5 border border-white/10 text-gray-300 px-8 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition">
                  Cancelar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
