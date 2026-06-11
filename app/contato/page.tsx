import Link from 'next/link'

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/home" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-8">
          <Link href="/sobre" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Sobre</Link>
          <Link href="/contato" className="text-sm font-medium text-oikos-blue">Contato</Link>
          <Link href="/login" className="bg-oikos-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Entrar</Link>
        </nav>
      </header>

      <div className="pt-32 pb-16 px-12 max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-3">Contato</p>
        <h1 className="text-5xl font-bold text-oikos-text tracking-tight mb-4">Fale comigo</h1>
        <p className="text-oikos-muted text-lg mb-12">Em breve os canais de contato estarao disponiveis aqui.</p>

        <div className="flex gap-4 justify-center">
          {['Email', 'LinkedIn', 'GitHub'].map(c => (
            <div key={c} className="bg-oikos-surface border border-oikos-border rounded-2xl p-8 w-48">
              <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">{c}</p>
              <p className="text-sm font-medium text-oikos-blue">Em breve</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
