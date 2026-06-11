'use client'

// app/projetos/[id]/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Projeto } from '@/lib/types'

const TIPO_LABEL: Record<string, string> = {
  islmbp: 'IS-LM-BP',
  oa_da:  'OA-DA',
  funcao: 'Funcoes Economicas',
  custom: 'Modelo Proprio',
}

export default function ProjetoPage() {
  const params  = useParams()
  const router  = useRouter()
  const supabase = createClient()

  const [projeto,   setProjeto]   = useState<Projeto | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [editando,  setEditando]  = useState(false)
  const [titulo,    setTitulo]    = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando,  setSalvando]  = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [aba,       setAba]       = useState<'visao' | 'compartilhar' | 'configuracao'>('visao')
  const [emailComp, setEmailComp] = useState('')
  const [permComp,  setPermComp]  = useState<'visualizar' | 'editar' | 'fork'>('visualizar')
  const [msgComp,   setMsgComp]   = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) { router.push('/projetos'); return }
      setProjeto(data)
      setTitulo(data.titulo)
      setDescricao(data.descricao || '')
      setLoading(false)
    }
    carregar()
  }, [params.id])

  async function salvar() {
    if (!projeto) return
    setSalvando(true)
    const { error } = await supabase
      .from('projetos')
      .update({ titulo, descricao, updated_at: new Date().toISOString() })
      .eq('id', projeto.id)
    if (!error) {
      setProjeto(prev => prev ? { ...prev, titulo, descricao } : null)
      setEditando(false)
    }
    setSalvando(false)
  }

  async function deletar() {
    if (!projeto) return
    if (!confirm('Tem certeza que deseja deletar este projeto? Esta acao nao pode ser desfeita.')) return
    setDeletando(true)
    await supabase.from('projetos').delete().eq('id', projeto.id)
    router.push('/projetos')
  }

  async function compartilhar() {
    if (!emailComp.trim() || !projeto) return
    setMsgComp(null)

    // Buscar usuário pelo email
    const { data: perfil } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailComp.trim())
      .single()

    if (!perfil) {
      setMsgComp('Usuário não encontrado.')
      return
    }

    const { error } = await supabase
      .from('compartilhamentos')
      .insert({
        projeto_id:     projeto.id,
        owner_id:       projeto.user_id,
        shared_with_id: perfil.id,
        permissao:      permComp,
      })

    if (error) {
      setMsgComp('Erro ao compartilhar. Verifique se já não foi compartilhado.')
    } else {
      setMsgComp('Projeto compartilhado com sucesso!')
      setEmailComp('')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-oikos-muted">Carregando...</div>
      </main>
    )
  }

  if (!projeto) return null

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-6">
          <Link href="/projetos" className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">
            Meus Projetos
          </Link>
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-sm text-oikos-muted hover:text-red-500 transition-colors">Sair</button>
          </form>
        </nav>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-5xl mx-auto">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm text-oikos-muted mb-6">
          <Link href="/projetos" className="hover:text-oikos-blue transition-colors">Projetos</Link>
          <span>/</span>
          <span className="text-oikos-text font-medium">{projeto.titulo}</span>
        </div>

        {/* HEADER DO PROJETO */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {editando ? (
              <div className="space-y-3">
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                  className="w-full text-3xl font-bold text-oikos-text border-b-2 border-oikos-blue outline-none pb-1 bg-transparent" />
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Descricao do projeto..."
                  rows={2}
                  className="w-full text-sm text-oikos-muted border border-oikos-border rounded-xl px-4 py-2 outline-none focus:border-oikos-blue resize-none" />
                <div className="flex gap-2">
                  <button onClick={salvar} disabled={salvando}
                    className="bg-oikos-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setEditando(false)}
                    className="bg-oikos-surface text-oikos-text px-5 py-2 rounded-xl text-sm border border-oikos-border hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-oikos-text tracking-tight">{projeto.titulo}</h1>
                  {projeto.publico && (
                    <span className="text-xs font-medium bg-green-50 text-oikos-green px-3 py-1 rounded-full">Publico</span>
                  )}
                </div>
                {projeto.descricao && (
                  <p className="text-oikos-muted mb-2">{projeto.descricao}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-oikos-muted">
                  <span className="bg-oikos-surface border border-oikos-border px-3 py-1 rounded-full font-medium">
                    {TIPO_LABEL[projeto.tipo] || projeto.tipo}
                  </span>
                  <span>Criado em {new Date(projeto.created_at).toLocaleDateString('pt-BR')}</span>
                  <span>Atualizado em {new Date(projeto.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </>
            )}
          </div>

          {!editando && (
            <div className="flex items-center gap-2 ml-6">
              <button onClick={() => setEditando(true)}
                className="bg-oikos-surface border border-oikos-border text-oikos-text px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                Editar
              </button>
              <button onClick={deletar} disabled={deletando}
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                {deletando ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          )}
        </div>

        {/* ABAS */}
        <div className="flex gap-1 bg-oikos-surface rounded-xl p-1 mb-8 w-fit">
          {[
            { id: 'visao',         label: 'Visao Geral' },
            { id: 'compartilhar',  label: 'Compartilhar' },
            { id: 'configuracao',  label: 'Configuracao' },
          ].map(a => (
            <button key={a.id} onClick={() => setAba(a.id as any)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${aba === a.id ? 'bg-white text-oikos-text shadow-sm' : 'text-oikos-muted hover:text-oikos-text'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ABA: VISAO GERAL */}
        {aba === 'visao' && (
          <div className="space-y-6">
            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-oikos-text mb-6">Sobre este projeto</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Tipo',       valor: TIPO_LABEL[projeto.tipo] || projeto.tipo },
                  { label: 'Visibilidade', valor: projeto.publico ? 'Publico' : 'Privado' },
                  { label: 'Criado em',  valor: new Date(projeto.created_at).toLocaleDateString('pt-BR') },
                ].map(m => (
                  <div key={m.label} className="bg-white border border-oikos-border rounded-xl p-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-oikos-muted mb-1">{m.label}</p>
                    <p className="text-sm font-semibold text-oikos-text">{m.valor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Area de trabalho */}
            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8 text-center">
              <h2 className="text-lg font-semibold text-oikos-text mb-2">Area de trabalho</h2>
              <p className="text-sm text-oikos-muted mb-6">
                O editor de simulacoes e analises deste projeto sera construido aqui.
              </p>
              <div className="inline-flex gap-3">
                <button
                  onClick={() => router.push(`/projetos/${projeto.id}/editor`)}
                  className="bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Abrir editor
                </button>
                <a href={process.env.NEXT_PUBLIC_LAB_URL || '#'} target="_blank" rel="noopener noreferrer"
                  className="bg-oikos-surface border border-oikos-border text-oikos-text px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                  Laboratorio Didatico
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ABA: COMPARTILHAR */}
        {aba === 'compartilhar' && (
          <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8">
            <h2 className="text-lg font-semibold text-oikos-text mb-6">Compartilhar projeto</h2>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-sm font-medium text-oikos-text block mb-1.5">Email do usuario</label>
                <input type="email" value={emailComp} onChange={e => setEmailComp(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue bg-white" />
              </div>

              <div>
                <label className="text-sm font-medium text-oikos-text block mb-1.5">Permissao</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'visualizar', label: 'Visualizar', desc: 'Pode ver o projeto' },
                    { id: 'editar',     label: 'Editar',     desc: 'Pode modificar' },
                    { id: 'fork',       label: 'Fork',       desc: 'Pode copiar' },
                  ].map(p => (
                    <button key={p.id} onClick={() => setPermComp(p.id as any)}
                      className={`text-left p-3 rounded-xl border text-sm transition-colors ${permComp === p.id ? 'border-oikos-blue bg-blue-50' : 'border-oikos-border bg-white hover:border-oikos-blue'}`}>
                      <p className={`font-medium ${permComp === p.id ? 'text-oikos-blue' : 'text-oikos-text'}`}>{p.label}</p>
                      <p className="text-xs text-oikos-muted mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={compartilhar}
                className="bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Compartilhar
              </button>

              {msgComp && (
                <div className={`p-3 rounded-xl text-sm ${msgComp.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msgComp}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: CONFIGURACAO */}
        {aba === 'configuracao' && (
          <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8">
            <h2 className="text-lg font-semibold text-oikos-text mb-6">Configuracao do projeto</h2>
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between py-4 border-b border-oikos-border">
                <div>
                  <p className="text-sm font-medium text-oikos-text">Visibilidade publica</p>
                  <p className="text-xs text-oikos-muted mt-0.5">Outros usuarios poderao encontrar e visualizar este projeto</p>
                </div>
                <input type="checkbox" checked={projeto.publico}
                  onChange={async e => {
                    await supabase.from('projetos').update({ publico: e.target.checked }).eq('id', projeto.id)
                    setProjeto(prev => prev ? { ...prev, publico: e.target.checked } : null)
                  }}
                  className="w-4 h-4 accent-oikos-blue" />
              </div>

              <div className="pt-4">
                <p className="text-sm font-medium text-red-600 mb-2">Zona de perigo</p>
                <button onClick={deletar} disabled={deletando}
                  className="bg-red-50 border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                  {deletando ? 'Deletando...' : 'Deletar projeto permanentemente'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}