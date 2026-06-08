'use client'

// app/perfil/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PerfilPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [loading,   setLoading]   = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [msg,       setMsg]       = useState<{ tipo: 'ok' | 'erro', texto: string } | null>(null)
  const [user,      setUser]      = useState<any>(null)
  const [nome,      setNome]      = useState('')
  const [instituicao, setInstituicao] = useState('')
  const [bio,       setBio]       = useState('')
  const [stats,     setStats]     = useState({ projetos: 0, simulacoes: 0 })

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Buscar perfil
      const { data: perfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setNome(perfil.nome || '')
        setInstituicao(perfil.instituicao || '')
        setBio(perfil.bio || '')
      } else {
        setNome(user.user_metadata?.nome || user.email?.split('@')[0] || '')
      }

      // Buscar stats
      const [{ count: projetos }, { count: simulacoes }] = await Promise.all([
        supabase.from('projetos').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('simulacoes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      setStats({ projetos: projetos || 0, simulacoes: simulacoes || 0 })
      setLoading(false)
    }
    carregar()
  }, [])

  async function salvar() {
    if (!user) return
    setSalvando(true)
    setMsg(null)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        nome,
        instituicao,
        bio,
      })

    if (error) {
      setMsg({ tipo: 'erro', texto: 'Erro ao salvar perfil.' })
    } else {
      setMsg({ tipo: 'ok', texto: 'Perfil atualizado com sucesso!' })
    }
    setSalvando(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-oikos-muted">Carregando...</div>
      </main>
    )
  }

  const inicial = nome ? nome[0].toUpperCase() : 'U'

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">Dashboard</Link>
          <Link href="/projetos" className="text-sm text-oikos-muted hover:text-oikos-blue transition-colors">Projetos</Link>
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-sm text-oikos-muted hover:text-red-500 transition-colors">Sair</button>
          </form>
        </nav>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-4xl mx-auto">

        {/* TITULO */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-1">Conta</p>
          <h1 className="text-4xl font-bold text-oikos-text tracking-tight">Meu Perfil</h1>
        </div>

        <div className="grid grid-cols-3 gap-8">

          {/* CARD DO PERFIL */}
          <div className="col-span-1">
            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-6 text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-oikos-blue to-oikos-purple flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {inicial}
              </div>
              <p className="text-base font-semibold text-oikos-text mb-1">{nome || 'Usuario'}</p>
              <p className="text-sm text-oikos-muted mb-1">{user?.email}</p>
              {instituicao && (
                <p className="text-xs text-oikos-muted">{instituicao}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Projetos',    valor: stats.projetos },
                { label: 'Simulacoes',  valor: stats.simulacoes },
              ].map(s => (
                <div key={s.label} className="bg-oikos-surface border border-oikos-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-oikos-blue">{s.valor}</p>
                  <p className="text-xs text-oikos-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="col-span-2">
            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-oikos-text mb-6">Informacoes pessoais</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-oikos-text block mb-1.5">Nome completo</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors bg-white" />
                </div>

                <div>
                  <label className="text-sm font-medium text-oikos-text block mb-1.5">Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm bg-oikos-surface text-oikos-muted cursor-not-allowed" />
                  <p className="text-xs text-oikos-muted mt-1">O email nao pode ser alterado.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-oikos-text block mb-1.5">
                    Instituicao <span className="text-oikos-muted font-normal">(opcional)</span>
                  </label>
                  <input type="text" value={instituicao} onChange={e => setInstituicao(e.target.value)}
                    placeholder="Ex: UFRRJ, USP, FGV..."
                    className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors bg-white" />
                </div>

                <div>
                  <label className="text-sm font-medium text-oikos-text block mb-1.5">
                    Bio <span className="text-oikos-muted font-normal">(opcional)</span>
                  </label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Fale um pouco sobre voce, seus interesses em economia..."
                    rows={4}
                    className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors bg-white resize-none" />
                </div>

                <button onClick={salvar} disabled={salvando}
                  className="bg-oikos-blue text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Salvar alteracoes'}
                </button>

                {msg && (
                  <div className={`p-3 rounded-xl text-sm ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.texto}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}