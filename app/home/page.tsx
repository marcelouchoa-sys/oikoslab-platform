import Link from 'next/link'

export default function HomePage() {
  const LAB_URL = process.env.NEXT_PUBLIC_LAB_URL || '#'

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-8">
          <Link href="/sobre" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Sobre</Link>
          <Link href="/laboratorio" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Laboratorio</Link>
          <Link href="/contato" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Contato</Link>
          <Link href="/login" className="bg-oikos-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Entrar
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="pt-40 pb-24 px-12 text-center bg-gradient-to-b from-oikos-surface to-white">
        <h1 className="text-6xl font-bold text-oikos-text tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
          Explore, simule e analise{' '}
          <span className="bg-gradient-to-r from-oikos-blue to-oikos-purple bg-clip-text text-transparent">
            economias completas
          </span>
        </h1>
        <p className="text-lg text-oikos-muted max-w-xl mx-auto mb-10 leading-relaxed">
          OikosLab é uma plataforma de simulação macroeconômica desenvolvida na UFRRJ.
          Do laboratório didático à plataforma profissional.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="bg-oikos-blue text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 transition-all hover:-translate-y-0.5">
            Criar conta gratis
          </Link>
          <a href={LAB_URL} target="_blank" rel="noopener noreferrer"
            className="bg-oikos-surface text-oikos-text px-7 py-3.5 rounded-xl text-base font-medium border border-oikos-border hover:bg-gray-100 transition-all hover:-translate-y-0.5">
            Laboratorio Didatico
          </a>
        </div>
      </section>

      {/* DUAS CAMADAS */}
      <section className="py-20 px-12 max-w-6xl mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-3 text-center">Como funciona</p>
        <h2 className="text-4xl font-bold text-oikos-text tracking-tight mb-16 text-center">Duas camadas, um ecossistema</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-oikos-surface border border-oikos-border border-t-4 border-t-oikos-green rounded-2xl p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-oikos-green mb-3">Camada 1</p>
            <h3 className="text-2xl font-bold text-oikos-text mb-4">Laboratorio Didatico</h3>
            <p className="text-oikos-muted leading-relaxed mb-6">
              Ambiente de aprendizado livre. Sem conta, sem cadastro.
              Explore funções econômicas, escolas de pensamento e IS-LM-BP.
            </p>
            <ul className="space-y-2 mb-8">
              {['Funcoes Economicas', 'Escolas de Pensamento', 'IS-LM-BP', 'Sem necessidade de conta'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-oikos-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-oikos-green flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <a href={LAB_URL} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-oikos-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Acessar Laboratorio
            </a>
          </div>

          <div className="bg-oikos-surface border border-oikos-border border-t-4 border-t-oikos-blue rounded-2xl p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-oikos-blue mb-3">Camada 2</p>
            <h3 className="text-2xl font-bold text-oikos-text mb-4">Plataforma Economica</h3>
            <p className="text-oikos-muted leading-relaxed mb-6">
              Ambiente profissional e persistente. Crie sua conta, salve projetos,
              construa modelos do zero e colabore com outros usuários.
            </p>
            <ul className="space-y-2 mb-8">
              {['Dashboard pessoal', 'Projetos salvos', 'Construtor de modelos', 'Compartilhamento', 'Historico de analises', 'Economia Real'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-oikos-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-oikos-blue flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="inline-block bg-oikos-blue text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-oikos-surface border-t border-oikos-border py-8 text-center">
        <p className="text-sm font-bold text-oikos-text mb-1">OikosLab</p>
        <p className="text-xs text-oikos-muted">Marcelo de Salles Cunha Uchoa · UFRRJ · 2026</p>
      </footer>

    </main>
  )
}
