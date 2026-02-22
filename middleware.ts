import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const pathname = request.nextUrl.pathname

  // Public paths
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  // Protected paths
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!token) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const payload = await verifyToken(token)
    if (!payload) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Role-based routing
    if (pathname.startsWith('/dashboard/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role}`, request.url))
    }
    if (pathname.startsWith('/dashboard/teacher') && payload.role !== 'teacher') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role}`, request.url))
    }
    if (pathname.startsWith('/dashboard/student') && payload.role !== 'student') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
