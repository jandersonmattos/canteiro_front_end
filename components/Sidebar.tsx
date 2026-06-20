'use client'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

import {
  House,
  BriefcaseBusiness,
  Percent,
  Users,
  Calculator,
  Bell
} from 'lucide-react'

export default function Sidebar() {

  const pathname = usePathname()

  // Extrair o ID do projeto da URL se estamos dentro de um projeto
  const projectIdMatch = pathname.match(/\/projects\/(view|edit)?\/([^/]+)/)
  const projectId = projectIdMatch?.[2]

  const menu = [
    {
      label: 'Obras',
      href: '/projects',
      icon: House
    },
    {
      label: 'Orçamentos',
      href: '/orcamentos',
      icon: Calculator
    },
    {
      label: 'Clientes',
      href: '/clientes',
      icon: Users
    },
    {
      label: 'Fornecedores',
      href: '/fornecedores',
      icon: BriefcaseBusiness
    },
    {
      label: 'BDIs',
      href: '/bdis',
      icon: Percent
    },
    ...(projectId
      ? [
          {
            label: 'Lembretes',
            href: `/projects/${projectId}/lembretes`,
            icon: Bell
          }
        ]
      : [])
  ]

  return (
    <aside
      className="
        w-[280px]
        bg-black
        border-r
        border-white/10
        p-6
        flex
        flex-col
      "
    >

      {/* LOGO */}
      <div className="flex items-center gap-4 mb-14">

        <div
          className="
            w-16
            h-16
            rounded-[24px]
            bg-emerald-500
            flex
            items-center
            justify-center
            shadow-2xl
            shadow-emerald-500/20
          "
        >

          <House size={30} />
        </div>

        <div>

          <h1 className="text-2xl font-bold text-white">
            Canteiro
          </h1>

          <p className="text-sm text-zinc-400">
            Gestão Inteligente
          </p>
        </div>
      </div>

      {/* MENU */}
      <nav className="space-y-3">

        {menu.map(item => {

          const Icon = item.icon

          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex
                items-center
                gap-4
                px-5
                h-14
                rounded-2xl
                transition-all
                border

                ${
                  active
                    ? `
                      bg-emerald-500/15
                      border-emerald-500/30
                      text-white
                    `
                    : `
                      border-transparent
                      text-zinc-400
                      hover:bg-white/5
                      hover:text-white
                    `
                }
              `}
            >

              <Icon size={22} />

              <span className="font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto text-xs text-zinc-500">
        Mattos Engenharia © 2026
      </div>
    </aside>
  )
}