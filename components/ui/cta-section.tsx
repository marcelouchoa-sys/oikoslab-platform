"use client"
import dynamic from "next/dynamic"
import Link from "next/link"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

const WebGLShader = dynamic(
  () => import("@/components/ui/web-gl-shader").then(m => ({ default: m.WebGLShader })),
  { ssr: false }
)

export function CTASection() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden min-h-[500px]">
      <WebGLShader />
      <div className="relative z-10 border border-white/10 p-2 w-full mx-auto max-w-3xl">
        <div className="relative border border-white/10 py-16 px-8 overflow-hidden text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Plataforma Econômica
          </span>
          <h2 className="mb-4 text-white text-5xl font-extrabold tracking-tight leading-tight">
            Comece a analisar<br />economias reais
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
            Crie sua conta, monte modelos econômicos e simule políticas com dados reais do mundo.
          </p>
          <div className="my-6 flex items-center justify-center gap-1">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <p className="text-xs text-green-400 ml-1">Plataforma disponível gratuitamente</p>
          </div>
          <div className="flex justify-center">
            <Link href="/login">
              <LiquidButton className="text-white border border-white/20 rounded-full" size="xl">
                Acessar Plataforma
              </LiquidButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
