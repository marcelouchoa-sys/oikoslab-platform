import Link from 'next/link'
import { OikosNavbar } from '@/components/ui/oikos-navbar'

export default function HomePage() {
  const LAB_URL = process.env.NEXT_PUBLIC_LAB_URL || '#'

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden relative">

      <OikosNavbar />

      {/* Glow Background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[120px]" />

      {/* HERO */}
      <section className="pt-40 pb-32 px-6 text-center relative z-10">
        <div className="max-w-6xl mx-auto">

          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-gray-300">
              Plataforma Econômica da UFRRJ
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
            Explore, simule e analise
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              economias completas
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            OikosLab é uma plataforma de simulação macroeconômica desenvolvida
            na UFRRJ. Conectando ensino, pesquisa e análise econômica em um
            ambiente moderno e intuitivo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold transition-all"
            >
              Criar Conta
            </Link>

            <a
              href={LAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-full font-medium transition-all"
            >
              Laboratório Didático
            </a>
          </div>

        </div>
      </section>

      {/* CAMADAS */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <p className="text-center text-sm uppercase tracking-widest text-gray-500 mb-3">
            Como funciona
          </p>

          <h2 className="text-center text-4xl font-bold text-white mb-16">
            Duas camadas, um ecossistema
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Laboratório */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6">
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>

              <p className="text-green-400 text-sm font-semibold uppercase mb-3">
                Camada 1
              </p>

              <h3 className="text-3xl font-bold text-white mb-4">
                Laboratório Didático
              </h3>

              <p className="text-gray-400 leading-relaxed mb-6">
                Ambiente de aprendizado livre. Explore funções econômicas,
                escolas de pensamento, IS-LM-BP e conceitos macroeconômicos
                sem necessidade de cadastro.
              </p>

              <ul className="space-y-3 text-gray-300 mb-8">
                <li>✓ Funções Econômicas</li>
                <li>✓ Escolas de Pensamento</li>
                <li>✓ IS-LM-BP</li>
                <li>✓ Sem necessidade de conta</li>
              </ul>

              <a
                href={LAB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
              >
                Acessar Laboratório
              </a>

            </div>

            {/* Plataforma */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
              </div>

              <p className="text-blue-400 text-sm font-semibold uppercase mb-3">
                Camada 2
              </p>

              <h3 className="text-3xl font-bold text-white mb-4">
                Plataforma Econômica
              </h3>

              <p className="text-gray-400 leading-relaxed mb-6">
                Crie projetos, salve análises, desenvolva modelos econômicos
                personalizados e compartilhe pesquisas com outros usuários.
              </p>

              <ul className="space-y-3 text-gray-300 mb-8">
                <li>✓ Dashboard Pessoal</li>
                <li>✓ Projetos Salvos</li>
                <li>✓ Construtor de Modelos</li>
                <li>✓ Compartilhamento</li>
                <li>✓ Histórico de Análises</li>
                <li>✓ Economia Real</li>
              </ul>

              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
              >
                Acessar Plataforma
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 relative z-10">
        <div className="max-w-6xl mx-auto text-center">

          <p className="text-xl font-bold text-white mb-2">
            OikosLab
          </p>

          <p className="text-gray-500">
            Marcelo de Salles Cunha Uchôa • UFRRJ • 2026
          </p>

        </div>
      </footer>

    </main>
  )
}