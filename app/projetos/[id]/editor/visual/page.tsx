'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Tipos de nós (definidos fora do componente para estabilidade) ─

function ParametroNode({ data, selected }: any) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${selected ? '#0066CC' : '#D2D2D7'}`, borderRadius: 12, padding: '10px 14px', minWidth: 130, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginBottom: 4 }}>Parametro</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#111' }}>{data.nome}</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>=</span>
        <span style={{ fontSize: 14, fontFamily: 'monospace', color: '#0066CC' }}>{data.valor}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#0066CC', border: 'none' }} />
    </div>
  )
}

function EquacaoNode({ data, selected }: any) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${selected ? '#7C3AED' : '#D2D2D7'}`, borderRadius: 12, padding: '10px 14px', minWidth: 160, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: '#7C3AED', border: 'none' }} />
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginBottom: 4 }}>{data.nome || 'Equacao'}</div>
      <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#111' }}>{data.variavel}</div>
      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF', marginTop: 2 }}>= {data.expressao}</div>
      <Handle type="source" position={Position.Right} style={{ width: 8, height: 8, background: '#16A34A', border: 'none' }} />
    </div>
  )
}

function ResultadoNode({ data, selected }: any) {
  return (
    <div style={{ background: '#fff', border: `2px solid ${selected ? '#16A34A' : '#D2D2D7'}`, borderRadius: 12, padding: '10px 14px', minWidth: 130, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <Handle type="target" position={Position.Left} style={{ width: 8, height: 8, background: '#16A34A', border: 'none' }} />
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginBottom: 4 }}>Resultado</div>
      <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#111' }}>{data.variavel}</div>
      {data.valor !== undefined && (
        <div style={{ fontSize: 20, fontWeight: 700, color: '#16A34A', marginTop: 4 }}>{Number(data.valor).toFixed(2)}</div>
      )}
    </div>
  )
}

const nodeTypes = {
  parametro: ParametroNode,
  equacao:   EquacaoNode,
  resultado: ResultadoNode,
}

// ── Canvas interno (usa useReactFlow que requer ReactFlowProvider) ─

interface FlowEditorProps {
  projeto: any
  onSalvar: (nodes: Node[], edges: Edge[]) => void
  salvando: boolean
  calculando: boolean
  onCalcular: () => void
}

function FlowEditor({ projeto, onSalvar, salvando, calculando, onCalcular }: FlowEditorProps) {
  const params = useParams()
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow()
  const [nodes, , onNodesChange] = useNodesState([])
  const [edges, , onEdgesChange] = useEdgesState([])

  const [painelAberto, setPainelAberto] = useState<'add' | null>(null)
  const [novoNome,  setNovoNome]  = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novoTipo,  setNovoTipo]  = useState<'parametro' | 'equacao' | 'resultado'>('parametro')
  const [novaVar,   setNovaVar]   = useState('')
  const [novaExpr,  setNovaExpr]  = useState('')

  // Carregar nós salvos do projeto
  useEffect(() => {
    if (projeto?.configuracao?.visual_nodes?.length) {
      setNodes(projeto.configuracao.visual_nodes)
    }
    if (projeto?.configuracao?.visual_edges?.length) {
      setEdges(projeto.configuracao.visual_edges)
    }
  }, [projeto?.id])

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: '#0066CC' } }, eds)),
    [setEdges]
  )

  function adicionarNo() {
    console.log('[adicionarNo]', { novoTipo, novoNome, novoValor })

    if (!novoNome.trim()) return

    const id  = crypto.randomUUID()
    const currentNodes = getNodes()
    const pos = { x: 150 + currentNodes.length * 60, y: 100 + currentNodes.length * 40 }

    const novoNo: Node =
      novoTipo === 'parametro'
        ? { id, type: 'parametro', position: pos, data: { nome: novoNome, valor: parseFloat(novoValor) || 0 } }
        : novoTipo === 'equacao'
        ? { id, type: 'equacao',   position: pos, data: { nome: novoNome, variavel: novaVar, expressao: novaExpr } }
        : { id, type: 'resultado', position: pos, data: { nome: novoNome, variavel: novaVar, valor: undefined } }

    console.log('[adicionarNo] novo nó criado:', novoNo)
    setNodes(prev => [...prev, novoNo])
    console.log('[adicionarNo] setNodes chamado, total de nós agora:', getNodes().length + 1)

    setNovoNome(''); setNovoValor(''); setNovaVar(''); setNovaExpr('')
    setPainelAberto(null)
  }

  function handleSalvar() {
    onSalvar(getNodes(), getEdges())
  }

  function handleCalcular() {
    onCalcular()
  }

  return (
    <div className="flex flex-col h-screen">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href={`/projetos/${params.id}/editor`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            ← Editor texto
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-800">{projeto?.titulo} — Editor Visual</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPainelAberto('add')}
            className="border border-gray-200 bg-gray-50 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
            + Adicionar bloco
          </button>
          <button type="button" onClick={handleCalcular} disabled={calculando}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
          <button type="button" onClick={handleSalvar} disabled={salvando}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: '#F5F5F7' }}
        >
          <Background color="#D2D2D7" gap={20} />
          <Controls />
          <MiniMap nodeColor="#0066CC" maskColor="rgba(245,245,247,0.8)" />
        </ReactFlow>
      </div>

      {/* MODAL ADICIONAR BLOCO */}
      {painelAberto === 'add' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setPainelAberto(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 24, width: 384, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 16 }}>Adicionar bloco</h3>

            {/* Tipo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['parametro', 'equacao', 'resultado'] as const).map(t => (
                <button type="button" key={t} onClick={() => setNovoTipo(t)}
                  style={{
                    flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${novoTipo === t ? '#0066CC' : '#E5E7EB'}`,
                    background: novoTipo === t ? '#0066CC' : '#fff', color: novoTipo === t ? '#fff' : '#6B7280', cursor: 'pointer', transition: 'all .15s',
                    textTransform: 'capitalize'
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Nome</label>
                <input
                  autoFocus
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') adicionarNo() }}
                  placeholder="Ex: c0, Consumo..."
                  style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {novoTipo === 'parametro' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Valor</label>
                  <input
                    type="number"
                    value={novoValor}
                    onChange={e => setNovoValor(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') adicionarNo() }}
                    placeholder="Ex: 100"
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {(novoTipo === 'equacao' || novoTipo === 'resultado') && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Variavel</label>
                  <input
                    value={novaVar}
                    onChange={e => setNovaVar(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') adicionarNo() }}
                    placeholder="Ex: C, Y, I..."
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {novoTipo === 'equacao' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Expressao</label>
                  <input
                    value={novaExpr}
                    onChange={e => setNovaExpr(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') adicionarNo() }}
                    placeholder="Ex: c0 + c1*(Y-T)"
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                type="button"
                onClick={adicionarNo}
                style={{ flex: 1, background: '#0066CC', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setPainelAberto(null)}
                style={{ flex: 1, background: '#F5F5F7', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────

export default function EditorVisualPage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [projeto,    setProjeto]    = useState<any>(null)
  const [salvando,   setSalvando]   = useState(false)
  const [calculando, setCalculando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase.from('projetos').select('*').eq('id', params.id).single()
      if (!data) { router.push('/projetos'); return }
      setProjeto(data)
    }
    carregar()
  }, [params.id])

  async function salvar(nodes: Node[], edges: Edge[]) {
    if (!projeto) return
    setSalvando(true)
    await supabase.from('projetos').update({
      configuracao: { ...projeto.configuracao, visual_nodes: nodes, visual_edges: edges },
      updated_at: new Date().toISOString(),
    }).eq('id', projeto.id)
    setSalvando(false)
  }

  async function calcular() {
    // implementação futura via useReactFlow
    setCalculando(true)
    setTimeout(() => setCalculando(false), 1000)
  }

  return (
    <main className="h-screen overflow-hidden">
      <ReactFlowProvider>
        <FlowEditor
          projeto={projeto}
          onSalvar={salvar}
          salvando={salvando}
          calculando={calculando}
          onCalcular={calcular}
        />
      </ReactFlowProvider>
    </main>
  )
}
