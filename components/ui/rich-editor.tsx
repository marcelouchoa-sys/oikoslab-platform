'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const ToolbarButton = ({ onClick, active, children, title }: any) => (
  <button type="button" onClick={onClick} title={title}
    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
    {children}
  </button>
)

export function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva suas notas aqui...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] text-sm text-gray-200 leading-relaxed',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [])

  if (!editor) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex items-center gap-0.5 p-2 border-b border-white/10 flex-wrap">
        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })} title="Título 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })} title="Título 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })} title="Título 3">H3</ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Formatação */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Negrito"><strong>B</strong></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Itálico"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')} title="Sublinhado"><u>U</u></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')} title="Destaque">▐</ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Listas */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Lista">• Lista</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Lista numerada">1. Lista</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} title="Citação">" Citar</ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Alinhamento */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })} title="Esquerda">⬛</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })} title="Centro">▣</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })} title="Justificar">▤</ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Símbolos econômicos */}
        <div className="flex items-center gap-0.5">
          {['α','β','γ','δ','ε','λ','μ','π','σ','τ','φ','ω','Δ','∑','∫','∂','∞','≈','≤','≥','→','←','↑','↓'].map(s => (
            <button key={s} type="button"
              onClick={() => editor.chain().focus().insertContent(s).run()}
              className="px-1.5 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition font-mono">
              {s}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">↪</ToolbarButton>
      </div>

      {/* EDITOR */}
      <div className="p-5">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror h1 { font-size: 1.6rem; font-weight: 700; color: #f9fafb; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-size: 1.3rem; font-weight: 600; color: #f3f4f6; margin: 0.8rem 0 0.4rem; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; color: #e5e7eb; margin: 0.6rem 0 0.3rem; }
        .ProseMirror p  { margin: 0.4rem 0; color: #d1d5db; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; color: #d1d5db; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; color: #d1d5db; }
        .ProseMirror blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; color: #9ca3af; font-style: italic; margin: 0.5rem 0; }
        .ProseMirror strong { color: #f9fafb; font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror mark { background: rgba(234,179,8,0.3); color: #fde047; padding: 0 2px; border-radius: 2px; }
        .ProseMirror .is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #4b5563; pointer-events: none; height: 0; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  )
}
