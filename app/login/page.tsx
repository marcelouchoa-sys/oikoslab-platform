'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [senha2, setSenha2] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro', texto: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setMsg({ tipo: 'erro', texto: 'Email ou senha incorretos.' })
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== senha2) return setMsg({ tipo: 'erro', texto: 'As senhas nao conferem.' })
    if (senha.length < 6) return setMsg({ tipo: 'erro', texto: 'Senha deve ter pelo menos 6 caracteres.' })
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome } }
    })
    if (error) {
      setMsg({ tipo: 'erro', texto: error.message })
    } else {
      setMsg({ tipo: 'ok', texto: 'Conta criada! Verifique seu email para confirmar.' })
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-oikos-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-oikos-border rounded-2xl p-10 shadow-sm">

        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight block mb-8">
          OikosLab
        </Link>

        <div className="flex gap-1 bg-oikos-surface rounded-xl p-1 mb-8">
          <button onClick={() => { setTab('login'); setMsg(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'login' ? 'bg-white text-oikos-text shadow-sm' : 'text-oikos-muted'}`}>
            Entrar
          </button>
          <button onClick={() => { setTab('cadastro'); setMsg(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'cadastro' ? 'bg-white text-oikos-text shadow-sm' : 'text-oikos-muted'}`}>
            Criar conta
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-oikos-blue text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Nome</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="Minimo 6 caracteres" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <div>
              <label className="text-sm font-medium text-oikos-text block mb-1.5">Confirmar senha</label>
              <input type="password" value={senha2} onChange={e => setSenha2(e.target.value)}
                placeholder="Repita a senha" required
                className="w-full border border-oikos-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-oikos-blue transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-oikos-blue text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        )}

        {msg && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.texto}
          </div>
        )}

      </div>
    </main>
  )
}
