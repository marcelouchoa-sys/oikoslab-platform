'use client'
import React from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Menu, X } from 'lucide-react'

export function OikosNavbar() {
  const [open, setOpen] = React.useState(false)
  const links = [
    { label: 'Home', href: '/home' },
    { label: 'Sobre', href: '/sobre' },
    { label: 'Contato', href: '/contato' },
  ]
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto h-14 px-6 flex items-center justify-between">
        <Link href="/home" className="flex items-center">
          <NextImage src="/logo-oikoslab.png" alt="OikosLab" width={130} height={28} priority className="object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition">
              {link.label}
            </Link>
          ))}
          <div className="ml-4 flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10 transition">Entrar</Link>
            <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">Criar Conta</Link>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden bg-slate-950 border-t border-white/10">
          <div className="flex flex-col p-6 gap-4">
            {links.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setOpen(false)} className="text-gray-300 hover:text-white">{link.label}</Link>
            ))}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              <Link href="/login" className="w-full text-center px-4 py-3 rounded-lg border border-white/20 text-white">Entrar</Link>
              <Link href="/login" className="w-full text-center px-4 py-3 rounded-lg bg-blue-600 text-white">Criar Conta</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
