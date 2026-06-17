export type Projeto = {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  tipo: 'simulador_completo' | 'cenario_calibrado' | 'construtor_funcoes' | 'islmbp' | 'oa_da' | 'funcao' | 'custom' | 'economia_real'
  configuracao: Record<string, any>
  publico: boolean
  created_at: string
  updated_at: string
  // Organisation
  is_favorite: boolean
  folder_id: string | null
  // Preparação para compartilhamento (sem UI por enquanto)
  is_shared: boolean
  shared_with: string[]
  visibility: 'private' | 'shared' | 'public'
}

export type Pasta = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type Profile = {
  id: string
  nome: string
  instituicao: string | null
  bio: string | null
  lattes: string | null
  linkedin: string | null
  github: string | null
  avatar_url: string | null
  created_at: string
}

export type Compartilhamento = {
  id: string
  projeto_id: string
  owner_id: string
  shared_with_id: string
  permissao: 'visualizar' | 'editar' | 'fork'
  created_at: string
}
