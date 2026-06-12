import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ProjetoRedirect({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: projeto } = await supabase
    .from('projetos')
    .select('tipo')
    .eq('id', params.id)
    .single()

  if (!projeto) redirect('/projetos')

  const rotas: Record<string, string> = {
    simulador_completo:  `/projetos/${params.id}/simulador-dinamico`,
    cenario_calibrado:   `/projetos/${params.id}/economia-real`,
    construtor_funcoes:  `/projetos/${params.id}/construtor`,
    // legados
    custom:              `/projetos/${params.id}/construtor`,
    economia_real:       `/projetos/${params.id}/economia-real`,
    islmbp:              `/projetos/${params.id}/simulador-dinamico`,
    oa_da:               `/projetos/${params.id}/simulador-dinamico`,
    funcao:              `/projetos/${params.id}/construtor`,
  }

  redirect(rotas[projeto.tipo] || `/projetos/${params.id}/construtor`)
}
