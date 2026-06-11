'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading,     setLoading]     = useState(true)
  const [salvando,    setSalvando]    = useState(false)
  const [msg,         setMsg]         = useState<{ tipo: 'ok' | 'erro', texto: string } | null>(null)
  const [user,        setUser]        = useState<any>(null)
  const [nome,        setNome]        = useState('')
  const [bio,         setBio]         = useState('')
  const [instituicao, setInstituicao] = useState('')
  const [lattes,      setLattes]      = useState('')
  const [linkedin,    setLinkedin]    = useState('')
  const [github,      setGithub]      = useState('')
  const [stats,       setStats]       = useState({ projetos: 0, simulacoes: 0 })

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: perfil } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (perfil) {
        setNome(perfil.nome || '')
        setBio(perfil.bio || '')
        setInstituicao(perfil.instituicao || '')
        setLattes(perfil.lattes || '')
        setLinkedin(perfil.linkedin || '')
        setGithub(perfil.github || '')
      } else {
        setNome(user.user_metadata?.nome || user.email?.split('@')[0] || '')
      }

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
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, nome, bio, instituicao, lattes, linkedin, github,
    })
    if (error) { setMsg({ tipo: 'erro', texto: 'Erro ao salvar.' }) }
    else { setMsg({ tipo: 'ok', texto: 'Perfil atualizado!' }) }
    setSalvando(false)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Carregando...</p>
    </main>
  )

  const inicial = nome ? nome[0].toUpperCase() : 'U'

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
            { label: 'Projetos',       href: '/projetos' },
            { label: 'Novo Projeto',   href: '/projetos/novo' },
            { label: 'Blog Econômico', href: '/blog' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {inicial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{nome}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <form action="/auth/logout" method="POST" className="mt-1">
            <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition">Sair</button>
          </form>
        </div>
      </aside>

      {/* CONTEUDO */}
      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
          <h1 className="text-lg font-semibold">Meu Perfil</h1>
          <p className="text-xs text-gray-500">Gerencie suas informações pessoais e links</p>
        </header>

        <div className="px-8 py-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8">

            {/* CARD DO PERFIL */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {inicial}
                </div>
                <p className="font-semibold text-white">{nome || 'Usuário'}</p>
                <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
                {instituicao && <p className="text-xs text-gray-500 mt-1">{instituicao}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Projetos',   valor: stats.projetos },
                  { label: 'Simulações', valor: stats.simulacoes },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{s.valor}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Links</p>
                {lattes && (
                  <a href={lattes} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-cyan-400 hover:underline">
                    Currículo Lattes
                  </a>
                )}
                {linkedin && (
                  <a href={linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    LinkedIn
                  </a>
                )}
                {github && (
                  <a href={github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-300 hover:underline">
                    GitHub
                  </a>
                )}
                {!lattes && !linkedin && !github && (
                  <p className="text-xs text-gray-600">Adicione seus links no formulário</p>
                )}
              </div>
            </div>

            {/* FORMULARIO */}
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-base font-semibold text-white mb-6">Informações pessoais</h2>
              <div className="space-y-5">
                {[
                  { label: 'Nome completo',    value: nome,        onChange: setNome,        placeholder: 'Seu nome',                   type: 'text' },
                  { label: 'Instituição',      value: instituicao, onChange: setInstituicao, placeholder: 'Ex: UFRRJ, USP, FGV...',      type: 'text' },
                  { label: 'Currículo Lattes', value: lattes,      onChange: setLattes,      placeholder: 'https://lattes.cnpq.br/...',  type: 'url'  },
                  { label: 'LinkedIn',         value: linkedin,    onChange: setLinkedin,    placeholder: 'https://linkedin.com/in/...', type: 'url'  },
                  { label: 'GitHub',           value: github,      onChange: setGithub,      placeholder: 'https://github.com/...',      type: 'url'  },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-sm text-gray-300 block mb-1.5">{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                ))}

                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Fale sobre você, seus interesses em economia..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1.5">Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-sm cursor-not-allowed" />
                </div>

                <button onClick={salvar} disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>

                {msg && (
                  <div className={`p-3 rounded-xl text-sm ${msg.tipo === 'ok' ? 'bg-green-500/15 text-green-300 border border-green-500/20' : 'bg-red-500/15 text-red-300 border border-red-500/20'}`}>
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
