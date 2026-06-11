'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Landmark } from 'lucide-react'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{
    tipo: 'ok' | 'erro'
    texto: string
  } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setMsg({
        tipo: 'erro',
        texto: 'Email ou senha incorretos.',
      })
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()

    if (senha !== senha2) {
      return setMsg({
        tipo: 'erro',
        texto: 'As senhas não conferem.',
      })
    }

    if (senha.length < 6) {
      return setMsg({
        tipo: 'erro',
        texto: 'A senha deve ter pelo menos 6 caracteres.',
      })
    }

    setLoading(true)
    setMsg(null)

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
        },
      },
    })

    if (error) {
      setMsg({
        tipo: 'erro',
        texto: error.message,
      })
    } else {
      setMsg({
        tipo: 'ok',
        texto: 'Conta criada com sucesso! Verifique seu email.',
      })
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-4 py-10 overflow-hidden relative">
      
      {/* Glow background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-4">
            <Landmark className="w-7 h-7 text-white" />
          </div>

          <Link
            href="/"
            className="text-3xl font-bold text-white tracking-tight"
          >
            OikosLab
          </Link>

          <p className="text-gray-400 text-sm mt-2 text-center">
            Plataforma de pesquisa econômica e análise de dados
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6">
          <button
            onClick={() => {
              setTab('login')
              setMsg(null)
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'login'
                ? 'bg-white/10 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Entrar
          </button>

          <button
            onClick={() => {
              setTab('cadastro')
              setMsg(null)
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'cadastro'
                ? 'bg-white/10 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* LOGIN */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Email
              </label>

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Senha
              </label>

              <input
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </form>
        ) : (
          /* CADASTRO */
          <form onSubmit={handleCadastro} className="space-y-4">

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Nome
              </label>

              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Email
              </label>

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Senha
              </label>

              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Confirmar senha
              </label>

              <input
                type="password"
                placeholder="Repita sua senha"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>

          </form>
        )}

        {/* Mensagens */}
        {msg && (
          <div
            className={`mt-5 rounded-xl p-3 text-sm ${
              msg.tipo === 'ok'
                ? 'bg-green-500/15 text-green-300 border border-green-500/20'
                : 'bg-red-500/15 text-red-300 border border-red-500/20'
            }`}
          >
            {msg.texto}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Desenvolvido para pesquisadores, estudantes e analistas econômicos.
          </p>
        </div>

      </div>
    </main>
  )
}