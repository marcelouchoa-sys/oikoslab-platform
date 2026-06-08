import Link from 'next/link'

export default function Home() {
  const LAB_URL = process.env.NEXT_PUBLIC_LAB_URL || '#'

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</span>
        <nav className="flex items-center gap-8">
          <a href="#sobre" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Sobre</a>
          <a href="#plataforma" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Plataforma</a>
          <a href="#contato" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Contato</a>
          <Link href="/login" className="bg-oikos-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Entrar na Plataforma
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section className="pt-40 pb-24 px-12 text-center bg-gradient-to-b from-oikos-surface to-white">
        <span className="inline-block bg-blue-50 text-oikos-blue text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
          Laboratório de Economia Experimental
        </span>
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
            Acessar Plataforma
          </Link>
          <a href={LAB_URL} target="_blank" rel="noopener noreferrer"
            className="bg-oikos-surface text-oikos-text px-7 py-3.5 rounded-xl text-base font-medium border border-oikos-border hover:bg-gray-100 transition-all hover:-translate-y-0.5">
            Laboratório Didático
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
            <h3 className="text-2xl font-bold text-oikos-text mb-4">Laboratório Didático</h3>
            <p className="text-oikos-muted leading-relaxed mb-6">
              Ambiente de aprendizado livre. Sem conta, sem cadastro.
              Explore funções econômicas, escolas de pensamento e o modelo IS-LM-BP
              de forma interativa e imediata.
            </p>
            <ul className="space-y-2 mb-8">
              {['Funções Econômicas', 'Escolas de Pensamento', 'IS-LM-BP (Mundell-Fleming)', 'Sem necessidade de conta'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-oikos-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-oikos-green flex-shrink-0" />
                  {i}
                </li>
              ))}
            </ul>
            <a href={LAB_URL} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-oikos-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Acessar Laboratório
            </a>
          </div>

          <div className="bg-oikos-surface border border-oikos-border border-t-4 border-t-oikos-blue rounded-2xl p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-oikos-blue mb-3">Camada 2</p>
            <h3 className="text-2xl font-bold text-oikos-text mb-4">Plataforma Econômica</h3>
            <p className="text-oikos-muted leading-relaxed mb-6">
              Ambiente profissional e persistente. Crie sua conta, salve projetos,
              construa modelos do zero e colabore com outros usuários.
            </p>
            <ul className="space-y-2 mb-8">
              {['Dashboard pessoal', 'Projetos salvos', 'Construtor de modelos', 'Compartilhamento e colaboração', 'Histórico de análises', 'Modelos econômicos avançados'].map(i => (
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

      {/* SOBRE */}
      <section id="sobre" className="py-20 px-12 bg-oikos-surface">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-3">Sobre o OikosLab</p>
          <h2 className="text-4xl font-bold text-oikos-text tracking-tight mb-12">Um laboratório construído para crescer</h2>
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="space-y-4 text-oikos-text leading-relaxed">
              <p>OikosLab é um projeto de graduação desenvolvido na Universidade Federal Rural do Rio de Janeiro (UFRRJ), com o objetivo de criar uma plataforma completa de simulação e análise econômica.</p>
              <p>O nome vem do grego <em>οἶκος</em> (oikos), que significa &quot;casa&quot; — raiz etimológica da palavra &quot;economia&quot;.</p>
              <p>O projeto cresce junto com o conhecimento econômico do autor ao longo de toda a graduação.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '2', desc: 'Camadas do sistema' },
                { num: '9', desc: 'Funções econômicas' },
                { num: '4', desc: 'Escolas de pensamento' },
                { num: '∞', desc: 'Em construção contínua' },
              ].map(s => (
                <div key={s.desc} className="bg-white border border-oikos-border rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold text-oikos-blue mb-1">{s.num}</div>
                  <div className="text-sm text-oikos-muted">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 px-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-3">Contato</p>
          <h2 className="text-4xl font-bold text-oikos-text tracking-tight mb-12">Fale comigo</h2>
          <div className="flex gap-4 justify-center">
            {['Email', 'LinkedIn', 'GitHub'].map(c => (
              <div key={c} className="bg-oikos-surface border border-oikos-border rounded-2xl p-8 w-48">
                <p className="text-xs font-semibold uppercase tracking-widest text-oikos-muted mb-2">{c}</p>
                <p className="text-sm font-medium text-oikos-blue">Em breve</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-oikos-surface border-t border-oikos-border py-8 text-center">
        <p className="text-sm font-bold text-oikos-text mb-1">OikosLab</p>
        <p className="text-xs text-oikos-muted">Marcelo de Salles Cunha Uchoa · UFRRJ · Projeto de graduacao em desenvolvimento continuo</p>
      </footer>

    </main>
  )
}
