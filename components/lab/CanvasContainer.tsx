'use client'
import { useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  BackgroundVariant, addEdge,
  useNodesState, useEdgesState,
  Handle, Position,
  type Node, type Edge, type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function OikosNode({ data }: { data: Record<string, unknown> }) {
  const tipo = (data.tipo as string) || 'modelo'
  const label = (data.label as string) || ''

  const palette: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    modelo:    { border: 'rgba(168,85,247,0.4)',  bg: 'rgba(168,85,247,0.08)', text: '#c4b5fd', badge: '#a78bfa' },
    dados:     { border: 'rgba(59,130,246,0.4)',  bg: 'rgba(59,130,246,0.08)', text: '#93c5fd', badge: '#60a5fa' },
    cenario:   { border: 'rgba(6,182,212,0.4)',   bg: 'rgba(6,182,212,0.08)',  text: '#67e8f9', badge: '#22d3ee' },
    resultado: { border: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.08)', text: '#6ee7b7', badge: '#34d399' },
    grafico:   { border: 'rgba(251,146,60,0.4)',  bg: 'rgba(251,146,60,0.08)', text: '#fdba74', badge: '#fb923c' },
    artigo:    { border: 'rgba(156,163,175,0.4)', bg: 'rgba(156,163,175,0.08)',text: '#d1d5db', badge: '#9ca3af' },
  }
  const s = palette[tipo] ?? palette.modelo

  return (
    <div style={{
      border: `1px solid ${s.border}`,
      background: s.bg,
      borderRadius: '12px',
      padding: '10px 18px',
      minWidth: '130px',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <Handle type="target" position={Position.Left}
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', width: 8, height: 8 }} />
      <p style={{ fontSize: '9px', color: s.badge, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px', fontWeight: 600 }}>
        {tipo}
      </p>
      <p style={{ fontSize: '12px', fontWeight: 700, color: s.text }}>{label}</p>
      <Handle type="source" position={Position.Right}
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', width: 8, height: 8 }} />
    </div>
  )
}

const nodeTypes = { oikos: OikosNode }

const initialNodes: Node[] = [
  { id: '1', type: 'oikos', position: { x: 80,  y: 180 }, data: { label: 'Cruz Keynesiana', tipo: 'modelo' } },
  { id: '2', type: 'oikos', position: { x: 320, y: 80  }, data: { label: 'IBGE — PIB Real',  tipo: 'dados' } },
  { id: '3', type: 'oikos', position: { x: 320, y: 290 }, data: { label: 'Cenário Base 2024',tipo: 'cenario' } },
  { id: '4', type: 'oikos', position: { x: 560, y: 180 }, data: { label: 'Multiplicador ∂Y/∂G', tipo: 'resultado' } },
]

const initialEdges: Edge[] = [
  { id: 'e1-3', source: '1', target: '3', style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 } },
  { id: 'e2-3', source: '2', target: '3', style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 } },
  { id: 'e3-4', source: '3', target: '4', style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 } },
]

export function CanvasContainer() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, style: { stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 } }, eds)),
    [setEdges],
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: '#0B0F19' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.05)" gap={24} size={1} />
        <Controls
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
        />
        <MiniMap
          nodeColor="rgba(255,255,255,0.08)"
          maskColor="rgba(0,0,0,0.5)"
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
        />
      </ReactFlow>
    </div>
  )
}
