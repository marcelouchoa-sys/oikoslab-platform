"use client"

import Link from "next/link"
import Image from "next/image"

export function OikosNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/logo-oikoslab.png"
            alt="OikosLab"
            width={32}
            height={32}
          />
          <span className="font-bold text-lg">
            OikosLab
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/home">Home</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
          <Link href="/login">Entrar</Link>
        </nav>
      </div>
    </header>
  )
}