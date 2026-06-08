export type Projeto = {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  tipo: 'islmbp' | 'oa_da' | 'funcao' | 'custom'
  configuracao: Record<string, any>
  publico: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  nome: string
  instituicao: string | null
  bio: string | null
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
