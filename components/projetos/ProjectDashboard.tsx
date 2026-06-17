'use client'

import { useReducer, useMemo, useCallback, useState, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Projeto, Pasta } from '@/lib/types'

// ── Lookup tables ──────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  simulador_completo: 'Simulador Completo',
  cenario_calibrado:  'Cenário Calibrado',
  construtor_funcoes: 'Construtor de Funções',
  islmbp:             'IS-LM-BP',
  oa_da:              'OA-DA',
  funcao:             'Funções',
  custom:             'Modelo Próprio',
  economia_real:      'Economia Real',
}

const TIPO_COR: Record<string, string> = {
  simulador_completo: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  cenario_calibrado:  'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  construtor_funcoes: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  islmbp:             'bg-blue-500/20 text-blue-300 border-blue-500/20',
  oa_da:              'bg-green-500/20 text-green-300 border-green-500/20',
  funcao:             'bg-purple-500/20 text-purple-300 border-purple-500/20',
  custom:             'bg-orange-500/20 text-orange-300 border-orange-500/20',
  economia_real:      'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
}

const TIPO_BORDA: Record<string, string> = {
  simulador_completo: 'border-t-blue-500/50',
  cenario_calibrado:  'border-t-cyan-500/50',
  construtor_funcoes: 'border-t-purple-500/50',
  islmbp:             'border-t-blue-500/50',
  oa_da:              'border-t-green-500/50',
  funcao:             'border-t-purple-500/50',
  custom:             'border-t-orange-500/50',
  economia_real:      'border-t-cyan-500/50',
}

// ── Types ──────────────────────────────────────────────────────────────────────
type FilterKey  = 'all' | 'favorites' | 'recent'
type SortKey    = 'recent' | 'oldest' | 'name'
type CardAction = 'rename' | 'delete' | 'share'

type ModalState =
  | { type: 'rename'; projectId: string; currentTitle: string }
  | { type: 'delete'; projectId: string; title: string }
  | { type: 'share';  projectId: string }
  | null

type State = {
  query:          string
  filter:         FilterKey
  selectedFolder: string | null
  sort:           SortKey
  projetos:       Projeto[]
  pastas:         Pasta[]
  newFolderName:  string
  showNewFolder:  boolean
  renamingId:     string | null
  renameValue:    string
  modal:          ModalState
}

type Action =
  | { type: 'SET_QUERY';           payload: string }
  | { type: 'SET_FILTER';          payload: FilterKey }
  | { type: 'SELECT_FOLDER';       payload: string | null }
  | { type: 'SET_SORT';            payload: SortKey }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'TOGGLE_FAVORITE';     payload: { id: string; is_favorite: boolean } }
  | { type: 'MOVE_TO_FOLDER';      payload: { projectId: string; folderId: string | null } }
  | { type: 'ADD_PASTA';           payload: Pasta }
  | { type: 'RENAME_PASTA';        payload: { id: string; name: string } }
  | { type: 'DELETE_PASTA';        payload: string }
  | { type: 'SET_NEW_FOLDER_NAME'; payload: string }
  | { type: 'TOGGLE_NEW_FOLDER' }
  | { type: 'START_RENAME';        payload: { id: string; name: string } }
  | { type: 'SET_RENAME_VALUE';    payload: string }
  | { type: 'CANCEL_RENAME' }
  | { type: 'OPEN_MODAL';          payload: NonNullable<ModalState> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'RENAME_PROJECT';      payload: { id: string; titulo: string } }
  | { type: 'DELETE_PROJECT';      payload: string }
  | { type: 'UPDATE_SHARING';      payload: { id: string; visibility: 'private' | 'shared' | 'public'; shared_with: string[] } }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_QUERY':         return { ...state, query: action.payload }
    case 'SET_FILTER':        return { ...state, filter: action.payload, selectedFolder: null }
    case 'SELECT_FOLDER':     return { ...state, selectedFolder: action.payload, filter: 'all' }
    case 'SET_SORT':          return { ...state, sort: action.payload }
    case 'CLEAR_FILTERS':     return { ...state, query: '', filter: 'all', selectedFolder: null }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        projetos: state.projetos.map(p =>
          p.id === action.payload.id ? { ...p, is_favorite: action.payload.is_favorite } : p
        ),
      }
    case 'MOVE_TO_FOLDER':
      return {
        ...state,
        projetos: state.projetos.map(p =>
          p.id === action.payload.projectId ? { ...p, folder_id: action.payload.folderId } : p
        ),
      }
    case 'ADD_PASTA':
      return { ...state, pastas: [...state.pastas, action.payload], showNewFolder: false, newFolderName: '' }
    case 'RENAME_PASTA':
      return {
        ...state,
        pastas:      state.pastas.map(f => f.id === action.payload.id ? { ...f, name: action.payload.name } : f),
        renamingId:  null,
        renameValue: '',
      }
    case 'DELETE_PASTA':
      return {
        ...state,
        pastas:         state.pastas.filter(f => f.id !== action.payload),
        projetos:       state.projetos.map(p => p.folder_id === action.payload ? { ...p, folder_id: null } : p),
        selectedFolder: state.selectedFolder === action.payload ? null : state.selectedFolder,
      }
    case 'SET_NEW_FOLDER_NAME': return { ...state, newFolderName: action.payload }
    case 'TOGGLE_NEW_FOLDER':   return { ...state, showNewFolder: !state.showNewFolder, newFolderName: '' }
    case 'START_RENAME':        return { ...state, renamingId: action.payload.id, renameValue: action.payload.name }
    case 'SET_RENAME_VALUE':    return { ...state, renameValue: action.payload }
    case 'CANCEL_RENAME':       return { ...state, renamingId: null, renameValue: '' }
    case 'OPEN_MODAL':          return { ...state, modal: action.payload }
    case 'CLOSE_MODAL':         return { ...state, modal: null }
    case 'RENAME_PROJECT':
      return {
        ...state,
        projetos: state.projetos.map(p =>
          p.id === action.payload.id ? { ...p, titulo: action.payload.titulo } : p
        ),
      }
    case 'DELETE_PROJECT':
      return { ...state, projetos: state.projetos.filter(p => p.id !== action.payload) }
    case 'UPDATE_SHARING':
      return {
        ...state,
        projetos: state.projetos.map(p =>
          p.id === action.payload.id
            ? { ...p, visibility: action.payload.visibility, shared_with: action.payload.shared_with }
            : p
        ),
      }
    default: return state
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────
export interface ProjectDashboardProps {
  projetosIniciais: Projeto[]
  pastasIniciais:   Pasta[]
  userId:           string
  userName:         string
  userEmail:        string
  userInitial:      string
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ProjectDashboard({
  projetosIniciais,
  pastasIniciais,
  userId,
  userName,
  userEmail,
  userInitial,
}: ProjectDashboardProps) {
  const supabase = createClient()
  const [pastaError, setPastaError] = useState<string | null>(null)

  const [state, dispatch] = useReducer(reducer, {
    query:          '',
    filter:         'all',
    selectedFolder: null,
    sort:           'recent',
    projetos:       projetosIniciais,
    pastas:         pastasIniciais,
    newFolderName:  '',
    showNewFolder:  false,
    renamingId:     null,
    renameValue:    '',
    modal:          null,
  })

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = state.projetos
    if (state.query.trim()) {
      const q = state.query.toLowerCase()
      list = list.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        (p.descricao ?? '').toLowerCase().includes(q)
      )
    }
    if (state.filter === 'favorites') {
      list = list.filter(p => p.is_favorite)
    } else if (state.filter === 'recent') {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      list = list.filter(p => new Date(p.updated_at).getTime() > cutoff)
    }
    if (state.selectedFolder === 'none')       list = list.filter(p => !p.folder_id)
    else if (state.selectedFolder !== null) list = list.filter(p => p.folder_id === state.selectedFolder)

    const sorted = [...list]
    if (state.sort === 'recent')       sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    else if (state.sort === 'oldest')  sorted.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    else                               sorted.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))
    return sorted
  }, [state.projetos, state.query, state.filter, state.selectedFolder, state.sort])

  // ── Derived counts ────────────────────────────────────────────────────────
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { none: 0 }
    for (const p of state.projetos) {
      if (!p.folder_id) counts.none++
      else counts[p.folder_id] = (counts[p.folder_id] ?? 0) + 1
    }
    return counts
  }, [state.projetos])

  const favCount = useMemo(
    () => state.projetos.filter(p => p.is_favorite).length,
    [state.projetos]
  )
  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    return state.projetos.filter(p => new Date(p.updated_at).getTime() > cutoff).length
  }, [state.projetos])

  // ── Pasta mutations ───────────────────────────────────────────────────────
  const createPasta = useCallback(async () => {
    const name = state.newFolderName.trim()
    if (!name) return
    setPastaError(null)
    const { data, error } = await supabase
      .from('pastas')
      .insert({ user_id: userId, name })
      .select()
      .single()
    if (error) {
      console.error('[createPasta]', error)
      setPastaError('Erro ao criar pasta. Execute a migration SQL no Supabase.')
      return
    }
    if (data) dispatch({ type: 'ADD_PASTA', payload: data as Pasta })
  }, [supabase, state.newFolderName, userId])

  const renamePasta = useCallback(async (id: string) => {
    const name = state.renameValue.trim()
    if (!name) return
    dispatch({ type: 'RENAME_PASTA', payload: { id, name } })
    await supabase.from('pastas').update({ name }).eq('id', id)
  }, [supabase, state.renameValue])

  const deletePasta = useCallback(async (id: string, name: string) => {
    if (!confirm(`Excluir pasta "${name}"? Os projetos nela ficarão sem pasta.`)) return
    dispatch({ type: 'DELETE_PASTA', payload: id })
    await supabase.from('pastas').delete().eq('id', id)
    await supabase.from('projetos').update({ folder_id: null }).eq('folder_id', id)
  }, [supabase])

  // ── Project mutations ─────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    const next = !current
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { id, is_favorite: next } })
    await supabase.from('projetos').update({ is_favorite: next }).eq('id', id)
  }, [supabase])

  const moveToFolder = useCallback(async (projectId: string, folderId: string | null) => {
    dispatch({ type: 'MOVE_TO_FOLDER', payload: { projectId, folderId } })
    await supabase.from('projetos').update({ folder_id: folderId }).eq('id', projectId)
  }, [supabase])

  const handleProjectAction = useCallback((action: CardAction, projectId: string) => {
    const projeto = state.projetos.find(p => p.id === projectId)
    if (!projeto) return
    if (action === 'rename') {
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'rename', projectId, currentTitle: projeto.titulo } })
    } else if (action === 'delete') {
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'delete', projectId, title: projeto.titulo } })
    } else {
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'share', projectId } })
    }
  }, [state.projetos])

  const renameProject = useCallback(async (id: string, titulo: string) => {
    dispatch({ type: 'RENAME_PROJECT', payload: { id, titulo } })
    dispatch({ type: 'CLOSE_MODAL' })
    await supabase.from('projetos').update({ titulo }).eq('id', id)
  }, [supabase])

  const deleteProject = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id })
    dispatch({ type: 'CLOSE_MODAL' })
    await supabase.from('projetos').delete().eq('id', id)
  }, [supabase])

  const updateSharing = useCallback(async (
    id: string,
    visibility: 'private' | 'shared' | 'public',
    shared_with: string[],
  ) => {
    dispatch({ type: 'UPDATE_SHARING', payload: { id, visibility, shared_with } })
    dispatch({ type: 'CLOSE_MODAL' })
    await supabase.from('projetos').update({ visibility, shared_with }).eq('id', id)
  }, [supabase])

  // ── Modal renderer ────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!state.modal) return null
    if (state.modal.type === 'rename') {
      const { projectId, currentTitle } = state.modal
      return (
        <RenameModal
          currentTitle={currentTitle}
          onConfirm={(titulo) => renameProject(projectId, titulo)}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )
    }
    if (state.modal.type === 'delete') {
      const { projectId, title } = state.modal
      return (
        <DeleteModal
          title={title}
          onConfirm={() => deleteProject(projectId)}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )
    }
    if (state.modal.type === 'share') {
      const { projectId } = state.modal
      const proj = state.projetos.find(p => p.id === projectId)
      if (!proj) return null
      return (
        <ShareModal
          projeto={proj}
          onSave={(visibility, shared_with) => updateSharing(projectId, visibility, shared_with)}
          onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        />
      )
    }
    return null
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="min-h-screen bg-[#0b0f19] text-white flex">

        {/* SIDEBAR */}
        <aside className="w-60 fixed left-0 top-0 h-full bg-white/[0.03] border-r border-white/10 flex flex-col overflow-hidden">

          {/* Logo */}
          <div className="p-5 border-b border-white/10 flex-shrink-0">
            <Link href="/home" className="flex items-center gap-2">
              <img src="/logo-oikoslab.png" alt="OikosLab" className="h-7 object-contain" />
            </Link>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-1 border-b border-white/10 flex-shrink-0">
            {([
              { label: 'Dashboard',      href: '/dashboard' },
              { label: 'Projetos',       href: '/projetos', ativo: true },
              { label: 'Novo Projeto',   href: '/projetos/novo' },
              { label: 'Blog Econômico', href: '/blog' },
              { label: 'Laboratório',    href: process.env.NEXT_PUBLIC_LAB_URL || '#', externo: true },
            ] as const).map(item =>
              (item as any).externo ? (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                    (item as any).ativo
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}>
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Quick Filters */}
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <p className="px-3 pb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Filtros</p>
            <SidebarFilter
              label="Todos"
              count={state.projetos.length}
              active={state.filter === 'all' && state.selectedFolder === null}
              onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
            />
            <SidebarFilter
              label="★ Favoritos"
              count={favCount}
              active={state.filter === 'favorites'}
              onClick={() => dispatch({ type: 'SET_FILTER', payload: 'favorites' })}
            />
            <SidebarFilter
              label="Recentes (30d)"
              count={recentCount}
              active={state.filter === 'recent'}
              onClick={() => dispatch({ type: 'SET_FILTER', payload: 'recent' })}
            />
          </div>

          {/* Pastas */}
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pastas</p>
              <button
                onClick={() => { dispatch({ type: 'TOGGLE_NEW_FOLDER' }); setPastaError(null) }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                + Nova
              </button>
            </div>

            {state.showNewFolder && (
              <div className="mx-1 mb-2">
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={state.newFolderName}
                    onChange={e => {
                      dispatch({ type: 'SET_NEW_FOLDER_NAME', payload: e.target.value })
                      if (pastaError) setPastaError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') createPasta()
                      if (e.key === 'Escape') dispatch({ type: 'TOGGLE_NEW_FOLDER' })
                    }}
                    placeholder="Nome da pasta"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={createPasta}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 rounded-lg transition"
                  >
                    OK
                  </button>
                </div>
                {pastaError && (
                  <p className="text-xs text-red-400 mt-1 px-1">{pastaError}</p>
                )}
              </div>
            )}

            <SidebarFilter
              label="📁 Sem pasta"
              count={folderCounts.none ?? 0}
              active={state.selectedFolder === 'none'}
              onClick={() => dispatch({ type: 'SELECT_FOLDER', payload: 'none' })}
            />

            {state.pastas.map(pasta => (
              <FolderItem
                key={pasta.id}
                pasta={pasta}
                count={folderCounts[pasta.id] ?? 0}
                active={state.selectedFolder === pasta.id}
                isRenaming={state.renamingId === pasta.id}
                renameValue={state.renameValue}
                onSelect={() => dispatch({ type: 'SELECT_FOLDER', payload: pasta.id })}
                onStartRename={() => dispatch({ type: 'START_RENAME', payload: { id: pasta.id, name: pasta.name } })}
                onRenameChange={v => dispatch({ type: 'SET_RENAME_VALUE', payload: v })}
                onRenameConfirm={() => renamePasta(pasta.id)}
                onRenameCancel={() => dispatch({ type: 'CANCEL_RENAME' })}
                onDelete={() => deletePasta(pasta.id, pasta.name)}
              />
            ))}
          </div>

          {/* User */}
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <Link href="/perfil" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </Link>
            <form action="/auth/logout" method="POST" className="mt-1">
              <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition">
                Sair
              </button>
            </form>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 ml-60 flex flex-col min-h-screen">

          {/* HEADER */}
          <header className="sticky top-0 z-40 px-8 py-4 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center gap-4">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-semibold leading-tight">Meus Projetos</h1>
              <p className="text-xs text-gray-500">
                {filtered.length} de {state.projetos.length} projeto{state.projetos.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 max-w-md mx-auto relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={state.query}
                onChange={e => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
                placeholder="Buscar por nome ou descrição..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={state.sort}
                onChange={e => dispatch({ type: 'SET_SORT', payload: e.target.value as SortKey })}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500/50 transition cursor-pointer appearance-none pr-7"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name">Nome A-Z</option>
              </select>
              <Link
                href="/projetos/novo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap"
              >
                + Novo Projeto
              </Link>
            </div>
          </header>

          {/* CONTENT */}
          <div className="px-8 py-8 max-w-7xl mx-auto w-full flex-1">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(p => (
                  <ProjectCard
                    key={p.id}
                    projeto={p}
                    pastas={state.pastas}
                    onToggleFavorite={toggleFavorite}
                    onMoveToFolder={moveToFolder}
                    onAction={handleProjectAction}
                  />
                ))}
              </div>
            ) : state.projetos.length === 0 ? (
              <EmptyState />
            ) : (
              <NoResults onClear={() => dispatch({ type: 'CLEAR_FILTERS' })} />
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {renderModal()}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SidebarFilter({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`text-xs tabular-nums flex-shrink-0 ml-1 ${active ? 'text-white/60' : 'text-gray-600'}`}>
        {count}
      </span>
    </button>
  )
}

function FolderItem({
  pasta, count, active, isRenaming, renameValue,
  onSelect, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
}: {
  pasta: Pasta; count: number; active: boolean; isRenaming: boolean; renameValue: string
  onSelect: () => void; onStartRename: () => void; onRenameChange: (v: string) => void
  onRenameConfirm: () => void; onRenameCancel: () => void; onDelete: () => void
}) {
  const [hover, setHover] = useState(false)

  if (isRenaming) {
    return (
      <div className="flex gap-1 mb-1">
        <input
          autoFocus
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onRenameConfirm()
            if (e.key === 'Escape') onRenameCancel()
          }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50"
        />
        <button onClick={onRenameConfirm} className="text-xs text-blue-400 hover:text-blue-300 px-1 transition">✓</button>
        <button onClick={onRenameCancel}  className="text-xs text-gray-500 hover:text-gray-300 px-1 transition">✕</button>
      </div>
    )
  }

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
          active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-base leading-none">📁</span>
          <span className="truncate">{pasta.name}</span>
        </span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {hover ? (
            <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={onStartRename} className="p-0.5 text-gray-500 hover:text-white transition text-xs" title="Renomear">✎</button>
              <button onClick={onDelete}      className="p-0.5 text-gray-500 hover:text-red-400 transition text-xs" title="Excluir">✕</button>
            </div>
          ) : (
            <span className={`text-xs tabular-nums ${active ? 'text-white/60' : 'text-gray-600'}`}>{count}</span>
          )}
        </div>
      </button>
    </div>
  )
}

function ProjectCard({
  projeto, pastas, onToggleFavorite, onMoveToFolder, onAction,
}: {
  projeto: Projeto
  pastas: Pasta[]
  onToggleFavorite: (id: string, current: boolean) => void
  onMoveToFolder:   (projectId: string, folderId: string | null) => void
  onAction:         (action: CardAction, projectId: string) => void
}) {
  const [showFolderMenu, setShowFolderMenu] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const folderMenuRef = useRef<HTMLDivElement>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)
  const pastaAtual    = pastas.find(f => f.id === projeto.folder_id)

  useEffect(() => {
    if (!showFolderMenu) return
    const h = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) setShowFolderMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showFolderMenu])

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  return (
    <div className={`bg-white/5 border border-white/10 border-t-2 ${TIPO_BORDA[projeto.tipo] || 'border-t-gray-500/50'} rounded-2xl p-5 hover:bg-white/[0.08] transition group flex flex-col`}>

      {/* Tipo + Ações */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${TIPO_COR[projeto.tipo] || 'bg-gray-500/20 text-gray-300 border-gray-500/20'}`}>
          {TIPO_LABEL[projeto.tipo] || projeto.tipo}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {projeto.publico && (
            <span className="text-xs px-2 py-0.5 mr-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              Público
            </span>
          )}

          {/* Star — quick toggle */}
          <button
            onClick={() => onToggleFavorite(projeto.id, projeto.is_favorite)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-base leading-none transition ${
              projeto.is_favorite
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-gray-700 hover:text-yellow-400 hover:bg-white/10'
            }`}
            title={projeto.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            ★
          </button>

          {/* ⋮ Action menu */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={() => setShowActionMenu(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition text-lg font-bold leading-none"
              title="Mais ações"
            >
              ⋮
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#11162a] border border-white/10 rounded-xl shadow-2xl py-1.5 z-30 min-w-[160px]">
                <button
                  onClick={() => { onAction('rename', projeto.id); setShowActionMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                >
                  <span>✎</span> Renomear
                </button>
                <button
                  onClick={() => { onToggleFavorite(projeto.id, projeto.is_favorite); setShowActionMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                >
                  <span>★</span>
                  {projeto.is_favorite ? 'Remover favorito' : 'Favoritar'}
                </button>
                <button
                  onClick={() => { onAction('share', projeto.id); setShowActionMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                >
                  <span>↗</span> Compartilhar
                </button>
                <div className="my-1 border-t border-white/5" />
                <button
                  onClick={() => { onAction('delete', projeto.id); setShowActionMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition flex items-center gap-2"
                >
                  <span>✕</span> Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Título + Descrição */}
      <Link href={`/projetos/${projeto.id}`} className="flex flex-col flex-1 min-h-0">
        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition leading-snug">
          {projeto.titulo}
        </h3>
        {projeto.descricao && (
          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
            {projeto.descricao}
          </p>
        )}
      </Link>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-600 flex-shrink-0">
            {new Date(projeto.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>

          {/* Folder picker */}
          <div className="relative" ref={folderMenuRef}>
            <button
              onClick={() => setShowFolderMenu(v => !v)}
              className={`text-xs px-1.5 py-0.5 rounded transition flex items-center gap-1 max-w-[100px] ${
                pastaAtual ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600 hover:text-gray-400'
              }`}
              title="Mover para pasta"
            >
              <span>📁</span>
              <span className="truncate">{pastaAtual ? pastaAtual.name : 'Sem pasta'}</span>
            </button>
            {showFolderMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-[#11162a] border border-white/10 rounded-xl shadow-2xl py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { onMoveToFolder(projeto.id, null); setShowFolderMenu(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition ${
                    !projeto.folder_id ? 'text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {!projeto.folder_id ? '✓ ' : ''}Sem pasta
                </button>
                {pastas.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { onMoveToFolder(projeto.id, f.id); setShowFolderMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition truncate ${
                      projeto.folder_id === f.id ? 'text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {projeto.folder_id === f.id ? '✓ ' : ''}{f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link href={`/projetos/${projeto.id}`} className="text-xs text-blue-400 group-hover:underline flex-shrink-0">
          Abrir →
        </Link>
      </div>
    </div>
  )
}

// ── Modals ─────────────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

function RenameModal({ currentTitle, onConfirm, onClose }: {
  currentTitle: string
  onConfirm: (titulo: string) => void
  onClose: () => void
}) {
  const [titulo, setTitulo] = useState(currentTitle)
  const canSave = titulo.trim().length > 0 && titulo.trim() !== currentTitle

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#11162a] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-4">Renomear projeto</h3>
        <input
          autoFocus
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && canSave) onConfirm(titulo.trim()) }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 mb-4"
          placeholder="Nome do projeto"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            Cancelar
          </button>
          <button
            onClick={() => canSave && onConfirm(titulo.trim())}
            disabled={!canSave}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function DeleteModal({ title, onConfirm, onClose }: {
  title: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#11162a] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-2">Excluir projeto</h3>
        <p className="text-sm text-gray-400 mb-6">
          Tem certeza que deseja excluir{' '}
          <span className="text-white font-medium">"{title}"</span>?{' '}
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function ShareModal({ projeto, onSave, onClose }: {
  projeto: Projeto
  onSave: (visibility: 'private' | 'shared' | 'public', shared_with: string[]) => void
  onClose: () => void
}) {
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>(projeto.visibility ?? 'private')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails]         = useState<string[]>(projeto.shared_with ?? [])

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase()
    if (e && !emails.includes(e)) setEmails(prev => [...prev, e])
    setEmailInput('')
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#11162a] border border-white/10 rounded-2xl p-6 w-[420px] shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-4">Compartilhar projeto</h3>

        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Visibilidade</p>
        <div className="flex gap-2 mb-5">
          {(['private', 'shared', 'public'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className={`flex-1 py-2 text-xs rounded-xl border transition ${
                visibility === v
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {v === 'private' ? '🔒 Privado' : v === 'shared' ? '👥 Compartilhado' : '🌐 Público'}
            </button>
          ))}
        </div>

        {visibility === 'shared' && (
          <>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Convidar usuários</p>
            <div className="flex gap-2 mb-3">
              <input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                placeholder="email@exemplo.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
              />
              <button onClick={addEmail} className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl transition">
                +
              </button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {emails.map(e => (
                  <span key={e} className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {e}
                    <button
                      onClick={() => setEmails(prev => prev.filter(x => x !== e))}
                      className="text-blue-400 hover:text-white transition ml-0.5"
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-xs text-gray-600 mb-5">
          {visibility === 'private'  && 'Apenas você pode ver este projeto.'}
          {visibility === 'shared'   && 'Apenas os usuários convidados terão acesso.'}
          {visibility === 'public'   && 'Qualquer pessoa com o link pode visualizar este projeto.'}
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition">
            Cancelar
          </button>
          <button
            onClick={() => onSave(visibility, emails)}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function EmptyState() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
      <p className="text-lg font-semibold text-white mb-2">Nenhum projeto ainda</p>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Crie seu primeiro projeto para começar a usar o laboratório econômico.
      </p>
      <Link
        href="/projetos/novo"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
      >
        Criar primeiro projeto
      </Link>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
      <p className="text-base font-semibold text-white mb-2">Nenhum projeto encontrado</p>
      <p className="text-sm text-gray-500 mb-4">Tente ajustar o filtro ou a busca.</p>
      <button onClick={onClear} className="text-sm text-blue-400 hover:text-blue-300 transition">
        Limpar filtros
      </button>
    </div>
  )
}
