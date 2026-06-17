import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ProjectDashboard } from '@/components/projetos/ProjectDashboard'
import type { Projeto, Pasta } from '@/lib/types'

export default async function ProjetosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nome     = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuario'
  const inicial  = nome[0].toUpperCase()

  const [{ data: projetos }, { data: pastas }] = await Promise.all([
    supabase
      .from('projetos')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('pastas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  // Garante defaults para colunas novas (caso a migration ainda não tenha rodado)
  const projetosNormalizados: Projeto[] = (projetos ?? []).map(p => ({
    ...p,
    is_favorite:  p.is_favorite  ?? false,
    folder_id:    p.folder_id    ?? null,
    is_shared:    p.is_shared    ?? false,
    shared_with:  p.shared_with  ?? [],
    visibility:   p.visibility   ?? 'private',
  }))

  return (
    <ProjectDashboard
      projetosIniciais={projetosNormalizados}
      pastasIniciais={(pastas as Pasta[]) ?? []}
      userId={user.id}
      userName={nome}
      userEmail={user.email ?? ''}
      userInitial={inicial}
    />
  )
}
