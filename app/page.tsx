'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

const WebGLShader = dynamic(
  () => import('@/components/ui/web-gl-shader').then(m => ({ default: m.WebGLShader })),
  { ssr: false }
)

export default function CTAPage() {
  return (
    <main className="relative flex w-full min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      <WebGLShader />
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-white text-6xl font-extrabold tracking-tight leading-tight mb-4">
          OikosLab
        </h1>
        <p className="text-white/60 text-lg mb-10">
          Laboratório de simulação macroeconômica
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link href="/home">
            <LiquidButton className="text-white border border-white/20 rounded-full" size="xl">
              Acessar Plataforma
            </LiquidButton>
          </Link>
          <Link href="/login" className="text-white/40 text-sm hover:text-white/70 transition-colors">
            Já tenho conta — fazer login
          </Link>
        </div>
      </div>
    </main>
  )
}
