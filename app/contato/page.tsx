import { OikosNavbar } from '@/components/ui/oikos-navbar'

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 overflow-hidden relative">
      <OikosNavbar />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[120px]" />
      <div className="pt-24 pb-16 px-12 max-w-3xl mx-auto text-center relative z-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Contato</p>
        <h1 className="text-5xl font-bold text-white tracking-tight mb-4">Fale comigo</h1>
        <p className="text-gray-400 text-lg mb-12">Em breve os canais de contato estarão disponíveis aqui.</p>
        <div className="flex gap-4 justify-center">
          {['Email', 'LinkedIn', 'GitHub'].map(c => (
            <div key={c} className="bg-white/5 border border-white/10 rounded-2xl p-8 w-48">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{c}</p>
              <p className="text-sm font-medium text-blue-400">Em breve</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
