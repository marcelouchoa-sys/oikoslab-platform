'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ProjetoRedirect() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function redirecionar() {
      const { data: projeto } = await supabase
        .from('projetos')
        .select('tipo')
        .eq('id', params.id)
        .single()

      if (!projeto) { router.push('/projetos'); return }

      const rotas: Record<string, string> = {
        simulador_completo: `/projetos/${params.id}/simulador-dinamico`,
        cenario_calibrado:  `/projetos/${params.id}/economia-real`,
        construtor_funcoes: `/projetos/${params.id}/construtor`,
        custom:             `/projetos/${params.id}/construtor`,
        economia_real:      `/projetos/${params.id}/economia-real`,
        islmbp:             `/projetos/${params.id}/simulador-dinamico`,
        oa_da:              `/projetos/${params.id}/simulador-dinamico`,
        funcao:             `/projetos/${params.id}/construtor`,
      }

      router.push(rotas[projeto.tipo] || `/projetos/${params.id}/construtor`)
    }
    redirecionar()
  }, [params.id])

  return (
    <main className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Carregando projeto...</p>
    </main>
  )
}
