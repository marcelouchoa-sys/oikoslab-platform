'use client'

// app/projetos/novo/page.tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TIPOS = [
  {
    id: 'islmbp',
    titulo: 'IS-LM-BP',
    desc: 'Modelo Mundell-Fleming. Analise politicas fiscal e monetaria em economia aberta ou fechada.',
    cor: 'border-t-oikos-blue',
    tag: 'Macroeconomia',
    tagCor: 'bg-blue-50 text-oikos-blue',
  },
  {
    id: 'oa_da',
    titulo: 'Oferta e Demanda Agregada',
    desc: 'Analise de equilibrio macroeconomico com OA e DA. Curto e longo prazo.',
    cor: 'border-t-oikos-green',
    tag: 'Macroeconomia',
    tagCor: 'bg-green-50 text-oikos-green',
  },
  {
    id: 'funcao',
    titulo: 'Funcoes Economicas',
    desc: 'Analise individual de funcoes: consumo, investimento, producao, mercado de trabalho e mais.',
    cor: 'border-t-oikos-purple',
    tag: 'Microeconomia',
    tagCor: 'bg-purple-50 text-oikos-purple',
  },
  {
    id: 'custom',
    titulo: 'Modelo Proprio',
    desc: 'Crie seu proprio modelo economico do zero. Defina equacoes, variaveis e parametros.',
    cor: 'border-t-oikos-slate',
    tag: 'Avancado',
    tagCor: 'bg-gray-100 text-oikos-slate',
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
    if (!titulo.trim()) return setErro('Digite um titulo para o projeto.')
    setLoading(true)
    setErro(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('projetos')
      .insert({
        user_id:     user.id,
        titulo:      titulo.trim(),
        descricao:   descricao.trim() || null,
        tipo:        tipoSel,
        publico,
        configuracao: {},
      })
      .select()
      .single()

    if (error) {
      setErro('Erro ao criar projeto. Tente novamente.')
      setLoading(false)
      return
    }

    router.push(`/projetos/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <Link href="/projetos" className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
          Cancelar
        </Link>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-4xl mx-auto">

        {/* PROGRESSO */}
        <div className="flex items-center gap-3 mb-10">
          <div className={`flex items-center gap-2 text-sm font-medium ${etapa === 'tipo' ? 'text-oikos-blue' : 'text-oikos-muted'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'tipo' ? 'bg-oikos-blue text-white' : 'bg-oikos-surface text-oikos-muted border border-oikos-border'}`}>1</span>
            Tipo de projeto
          </div>
          <div className="h-px w-8 bg-oikos-border" />
          <div className={`flex items-center gap-2 text-sm font-medium ${etapa === 'detalhes' ? 'text-oikos-blue' : 'text-oikos-muted'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'detalhes' ? 'bg-oikos-blue text-white' : 'bg-oikos-surface text-oikos-muted border border-oikos-border'}`}>2</span>
            Detalhes
          </div>
        </div>

        {etapa === 'tipo' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-oikos-text tracking-tight mb-2">
                Qual tipo de projeto voce quer criar?
              </h1>
              <p className="text-oikos-muted">Escolha o modelo base ou crie do zero.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => setTipoSel(t.id)}
                  className={`text-left bg-oikos-surface border border-t-4 ${t.cor} rounded-2xl p-6 transition-all hover:shadow-md ${tipoSel === t.id ? 'border-oikos-blue ring-2 ring-oikos-blue ring-offset-2' : 'border-oikos-border'}`}>
                  <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${t.tagCor}`}>
                    {t.tag}
                  </span>
                  <h3 className="text-base font-semibold text-oikos-text mb-2">{t.titulo}</h3>
                  <p className="text-sm text-oikos-muted leading-relaxed">{t.desc}</p>
                </button>
              ))}
            </div>

            <button onClick={() => tipoSel && setEtapa('detalhes')}
              disabled={!tipoSel}
              className="bg-oikos-blue text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continuar
            </button>
          </>
        )}

        {etapa === 'detalhes' && (
          <>
            <div className="mb-8">
              <button onClick={() => setEtapa('tipo')} className="text-sm text-oikos-muted hover:text-oikos-blue mb-4 transition-colors">
                Voltar
              </button>
              <h1 className="text-3xl font-bold text-oikos-text tracking-tight mb-2">
                Detalhes do projeto
              </h1>
              <p className="text-oikos-muted">
                Tipo selecionado: <span className="font-medium text-oikos-text">
                  {TIPOS.find(t => t.id === tipoSel)?.titulo}
                </span>
              </p>
            </div>

            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8 space-y-6">
              <div>
                <label className="text-sm font-medium text-oikos-text block mb-1.5">
                  Titulo do projeto <span className="text-red-500">*</span>
                </label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Analise do Plano Real, Modelo Keynesiano Basico..."
                  className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors bg-white" />
              </div>

              <div>
                <label className="text-sm font-medium text-oikos-text block mb-1.5">
                  Descricao <span className="text-oikos-muted font-normal">(opcional)</span>
                </label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Descreva o objetivo do projeto, hipoteses ou contexto economico..."
                  rows={3}
                  className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors bg-white resize-none" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="publico" checked={publico}
                  onChange={e => setPublico(e.target.checked)}
                  className="w-4 h-4 accent-oikos-blue" />
                <label htmlFor="publico" className="text-sm text-oikos-text cursor-pointer">
                  Tornar projeto publico
                  <span className="text-oikos-muted font-normal ml-1">
                    (outros usuarios poderao visualizar)
                  </span>
                </label>
              </div>
            </div>

            {erro && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{erro}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={criar} disabled={loading}
                className="bg-oikos-blue text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? 'Criando...' : 'Criar projeto'}
              </button>
              <Link href="/projetos"
                className="bg-oikos-surface text-oikos-text px-8 py-3 rounded-xl text-sm font-medium border border-oikos-border hover:bg-gray-100 transition-colors">
                Cancelar
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}