'use client'

// app/perfil/page.tsx
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PerfilPage() {
  const supabase = createClient()
  const router   = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading,    setLoading]    = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [enviando,   setEnviando]   = useState(false)
  const [msg,        setMsg]        = useState<{ tipo: 'ok' | 'erro', texto: string } | null>(null)
  const [user,       setUser]       = useState<any>(null)
  const [nome,       setNome]       = useState('')
  const [instituicao,setInstituicao]= useState('')
  const [bio,        setBio]        = useState('')
  const [lattes,     setLattes]     = useState('')
  const [linkedin,   setLinkedin]   = useState('')
  const [github,     setGithub]     = useState('')
  const [avatarUrl,  setAvatarUrl]  = useState('')
  const [stats,      setStats]      = useState({ projetos: 0, simulacoes: 0 })

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
        setLattes(perfil.lattes || '')
        setLinkedin(perfil.linkedin || '')
        setGithub(perfil.github || '')
        setAvatarUrl(perfil.avatar_url || '')
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

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setEnviando(true)
    setMsg(null)

    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const novaUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: novaUrl })

      if (updateError) throw updateError

      setAvatarUrl(novaUrl)
      setMsg({ tipo: 'ok', texto: 'Foto de perfil atualizada!' })
    } catch (err) {
      console.error(err)
      setMsg({ tipo: 'erro', texto: 'Erro ao enviar foto. Verifique se o bucket "avatars" existe.' })
    }
    setEnviando(false)
  }

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
        lattes,
        linkedin,
        github,
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
      <main className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-sm text-gray-500">Carregando...</div>
      </main>
    )
  }

  const inicial = nome ? nome[0].toUpperCase() : 'U'

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/10 px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Dashboard</Link>
          <Link href="/projetos" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Projetos</Link>
          <form action="/auth/logout" method="POST">
            <button type="submit" className="text-sm text-gray-400 hover:text-red-400 transition-colors">Sair</button>
          </form>
        </nav>
      </header>

      <div className="pt-24 px-12 pb-16 max-w-4xl mx-auto">

        {/* TITULO */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-1">Conta</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">Meu Perfil</h1>
        </div>

        <div className="grid grid-cols-3 gap-8">

          {/* CARD DO PERFIL */}
          <div className="col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-4">
              <div className="relative w-20 h-20 mx-auto mb-4 group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome}
                    className="w-20 h-20 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {inicial}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={enviando}
                  className="absolute inset-0 w-20 h-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-medium text-white transition-opacity disabled:opacity-100 disabled:bg-black/40">
                  {enviando ? '...' : 'Alterar'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
              </div>
              <p className="text-base font-semibold text-white mb-1">{nome || 'Usuario'}</p>
              <p className="text-sm text-gray-400 mb-1">{user?.email}</p>
              {instituicao && (
                <p className="text-xs text-gray-500">{instituicao}</p>
              )}

              {/* Links sociais */}
              {(lattes || linkedin || github) && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/10">
                  {lattes && (
                    <a href={lattes} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-colors">
                      Lattes
                    </a>
                  )}
                  {linkedin && (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors">
                      LinkedIn
                    </a>
                  )}
                  {github && (
                    <a href={github} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors">
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Projetos',    valor: stats.projetos },
                { label: 'Simulações',  valor: stats.simulacoes },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{s.valor}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-white mb-6">Informações pessoais</h2>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-white block mb-1.5">Nome completo</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white block mb-1.5">Email</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-white block mb-1.5">
                    Instituição <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <input type="text" value={instituicao} onChange={e => setInstituicao(e.target.value)}
                    placeholder="Ex: UFRRJ, USP, FGV..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="text-sm font-medium text-white block mb-1.5">
                    Bio <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Fale um pouco sobre você, seus interesses em economia..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
                </div>

                {/* LINKS ACADEMICOS / SOCIAIS */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4 mt-5">
                    Links acadêmicos e profissionais <span className="font-normal">(opcional)</span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white block mb-1.5">Currículo Lattes</label>
                      <input type="url" value={lattes} onChange={e => setLattes(e.target.value)}
                        placeholder="http://lattes.cnpq.br/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white block mb-1.5">LinkedIn</label>
                      <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white block mb-1.5">GitHub</label>
                      <input type="url" value={github} onChange={e => setGithub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <button onClick={salvar} disabled={salvando}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>

                {msg && (
                  <div className={`p-3 rounded-xl text-sm ${msg.tipo === 'ok' ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
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