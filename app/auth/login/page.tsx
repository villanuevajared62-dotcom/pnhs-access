'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
      // Redirect based on role
      const role = data.role
      if (role === 'admin') router.push('/dashboard/admin')
      else if (role === 'teacher') router.push('/dashboard/teacher')
      else router.push('/dashboard/student')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const fillDemo = (u: string, p: string) => { setUsername(u); setPassword(p) }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-green-200 rounded-full opacity-50" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-2 border-yellow-200 rounded-full opacity-50" />
      
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-0 items-center">
        {/* Left - School Info */}
        <div className="hidden lg:block text-center p-10">
          <div className="w-32 h-32 bg-gradient-to-br from-green-700 to-green-900 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-2xl font-display">PNHS</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-green-800 mb-2">Pantabangan<br/>National<br/>High School</h1>
          <div className="w-16 h-1 bg-yellow-500 mx-auto my-4 rounded" />
          <p className="font-semibold text-green-700">ACCESS Portal</p>
          <p className="text-gray-500 text-sm mt-2">Villarica, Pantabangan, Nueva Ecija</p>
          <p className="text-gray-400 text-xs mt-1">Est. 1996 • R.A. 7746</p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
            <div className="w-8 h-8 bg-yellow-700 rounded-full flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-green-800 font-semibold text-sm ml-2">Academic Content &<br/>Community Enhancement System</span>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Welcome Back! 👋</h2>
          <p className="text-gray-500 text-sm mb-6">Please sign in to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3 text-base">
              {loading ? '⏳ Signing in...' : '🔒 Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Demo Credentials
            </div>
            <div className="space-y-2">
              {[
                { label: 'Admin', u: 'admin', p: 'admin123' },
                { label: 'Teacher', u: 'teacher1', p: 'teacher123' },
                { label: 'Student', u: 'student1', p: 'student123' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm font-medium">{d.label}:</span>
                  <button onClick={() => fillDemo(d.u, d.p)} className="bg-white border border-green-200 hover:bg-green-50 text-green-700 text-xs font-mono px-3 py-1 rounded-lg transition-colors">
                    {d.u} / {d.p}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-green-700 transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
