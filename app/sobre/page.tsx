import Link from 'next/link'

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border px-12 h-16 flex items-center justify-between">
        <Link href="/home" className="text-xl font-bold text-oikos-text tracking-tight">OikosLab</Link>
        <nav className="flex items-center gap-8">
          <Link href="/sobre" className="text-sm font-medium text-oikos-blue">Sobre</Link>
          <Link href="/contato" className="text-sm font-medium text-oikos-muted hover:text-oikos-blue transition-colors">Contato</Link>
          <Link href="/login" className="bg-oikos-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Entrar</Link>
        </nav>
      </header>

      <div className="pt-32 pb-16 px-12 max-w-4xl mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase text-oikos-muted mb-3">Sobre</p>
        <h1 className="text-5xl font-bold text-oikos-text tracking-tight mb-8">O que é o OikosLab</h1>

        <div className="space-y-6 text-oikos-text leading-relaxed text-lg">
          <p>OikosLab é um projeto de graduação desenvolvido na Universidade Federal Rural do Rio de Janeiro (UFRRJ), com o objetivo de criar uma plataforma completa de simulação e análise econômica.</p>
          <p>O nome vem do grego <em>οἶκος</em> (oikos), que significa &quot;casa&quot; — raiz etimológica da palavra &quot;economia&quot;.</p>
          <p>O projeto cresce junto com o conhecimento econômico do autor ao longo de toda a graduação, sendo atualizado continuamente com novos modelos, dados e funcionalidades.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-16">
          <div>
            <h2 className="text-2xl font-bold text-oikos-text mb-4">O autor</h2>
            <div className="bg-oikos-surface border border-oikos-border rounded-2xl p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-oikos-blue to-oikos-purple flex items-center justify-center text-white text-xl font-bold mb-4">M</div>
              <p className="font-semibold text-oikos-text">Marcelo de Salles Cunha Uchoa</p>
              <p className="text-sm text-oikos-muted mt-1">Estudante de Economia — UFRRJ</p>
              <p className="text-sm text-oikos-muted mt-3 leading-relaxed">Em breve — texto sobre trajetória e motivações.</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-oikos-text mb-4">Numeros</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: '3', desc: 'Tipos de projeto' },
                { num: '9', desc: 'Funcoes economicas' },
                { num: '4', desc: 'Escolas de pensamento' },
                { num: '200+', desc: 'Paises com dados reais' },
              ].map(s => (
                <div key={s.desc} className="bg-oikos-surface border border-oikos-border rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-oikos-blue mb-1">{s.num}</div>
                  <div className="text-xs text-oikos-muted">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
