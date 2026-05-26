import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const AUTH_PAGES = [
  '/login',
  '/forgot-password',
  '/verify-code',
  '/reset-password'
]

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get('token')?.value
  const authPage = isAuthPage(pathname)
  const homePage = pathname === '/'

  if (!token && !authPage && !homePage) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${pathname}${search}`

    loginUrl.searchParams.set('next', nextPath)

    return NextResponse.redirect(loginUrl)
  }

  if (token && (authPage || homePage)) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
}