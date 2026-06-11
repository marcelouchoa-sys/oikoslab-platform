"use client"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import NextImage from "next/image"

export function OikosNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-oikos-border">
      <div className="px-8 py-3">
        {/* DESKTOP */}
        <nav className="hidden justify-between lg:flex items-center">
          <div className="flex items-center gap-8">
            <Link href="/home" className="flex items-center gap-2">
              <NextImage src="/logo-oikoslab.png" alt="OikosLab" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold text-oikos-text tracking-tight">OikosLab</span>
            </Link>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/home" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-oikos-muted transition-colors hover:text-oikos-blue">
                      Home
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-oikos-muted text-sm font-medium bg-transparent hover:bg-transparent hover:text-oikos-blue data-[state=open]:bg-transparent">
                    Plataforma
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-64 p-3">
                      {[
                        { title: 'Dashboard',     desc: 'Seu painel principal',        href: '/dashboard' },
                        { title: 'Meus Projetos', desc: 'Acesse seus projetos salvos', href: '/projetos' },
                        { title: 'Novo Projeto',  desc: 'Crie uma nova analise',       href: '/projetos/novo' },
                      ].map(item => (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link href={item.href} className="flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-oikos-surface hover:text-oikos-blue">
                              <div>
                                <div className="text-sm font-semibold text-oikos-text">{item.title}</div>
                                <p className="text-xs leading-snug text-oikos-muted mt-0.5">{item.desc}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/sobre" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-oikos-muted transition-colors hover:text-oikos-blue">
                      Sobre
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/contato" className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-oikos-muted transition-colors hover:text-oikos-blue">
                      Contato
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="bg-oikos-blue hover:bg-blue-700">
              <Link href="/login">Criar conta</Link>
            </Button>
          </div>
        </nav>

        {/* MOBILE */}
        <div className="flex items-center justify-between lg:hidden">
          <Link href="/home" className="flex items-center gap-2">
            <Image src="/logo-oikoslab.png" alt="OikosLab" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold text-oikos-text">OikosLab</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  <Link href="/home" className="flex items-center gap-2">
                    <Image src="/logo-oikoslab.png" alt="OikosLab" width={28} height={28} className="w-7 h-7 object-contain" />
                    <span className="text-lg font-bold">OikosLab</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <Link href="/home" className="font-medium text-oikos-text">Home</Link>
                <Link href="/dashboard" className="font-medium text-oikos-text">Dashboard</Link>
                <Link href="/projetos" className="font-medium text-oikos-text">Projetos</Link>
                <Link href="/sobre" className="font-medium text-oikos-text">Sobre</Link>
                <Link href="/contato" className="font-medium text-oikos-text">Contato</Link>
                <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                  <Button asChild variant="outline"><Link href="/login">Entrar</Link></Button>
                  <Button asChild className="bg-oikos-blue hover:bg-blue-700"><Link href="/login">Criar conta</Link></Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
