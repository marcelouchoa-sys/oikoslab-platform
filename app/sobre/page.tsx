import { OikosNavbar } from '@/components/ui/oikos-navbar'

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden relative">
      <OikosNavbar />
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-[120px]" />
      <div className="pt-24 pb-16 px-12 max-w-4xl mx-auto relative z-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Sobre</p>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-8">O que é o OikosLab</h1>
        <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
          <p>OikosLab é um projeto de graduação desenvolvido na Universidade Federal Rural do Rio de Janeiro (UFRRJ), com o objetivo de criar uma plataforma completa de simulação e análise econômica.</p>
          <p>O nome vem do grego <em>οἶκος</em> (oikos), que significa &quot;casa&quot; — raiz etimológica da palavra &quot;economia&quot;.</p>
          <p>O projeto cresce junto com o conhecimento econômico do autor ao longo de toda a graduação.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 mt-16">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">O autor</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold mb-4">M</div>
              <p className="font-semibold text-white">Marcelo de Salles Cunha Uchôa</p>
              <p className="text-sm text-gray-400 mt-1">Estudante de Economia — UFRRJ</p>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">Em breve — texto sobre trajetória e motivações.</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Números</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: '3', desc: 'Tipos de projeto' },
                { num: '9', desc: 'Funções econômicas' },
                { num: '4', desc: 'Escolas de pensamento' },
                { num: '200+', desc: 'Países com dados reais' },
              ].map(s => (
                <div key={s.desc} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{s.num}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
