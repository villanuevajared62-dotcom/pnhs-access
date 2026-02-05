'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Lock, User, AlertCircle, Eye, EyeOff, BookOpen } from 'lucide-react'
import { authenticateUser, saveUserToStorage } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = authenticateUser(formData)

    if (result.success && result.user) {
      saveUserToStorage(result.user)
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (result.user.role === 'teacher') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } else {
      setError(result.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 sm:w-48 sm:h-48 border-4 border-green-600 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 sm:w-56 sm:h-56 border-4 border-yellow-500 rounded-full animate-pulse delay-150"></div>
          <BookOpen className="absolute top-1/4 right-1/4 w-16 h-16 sm:w-24 sm:h-24 text-green-600 opacity-30 animate-bounce" />
        </div>
      </div>

      <div className="w-full max-w-6xl relative grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6 p-8">
          <div className="relative">
            {/* School Logo */}
            <div className="w-48 h-48 xl:w-64 xl:h-64 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full shadow-2xl overflow-hidden">
                <img 
                  src="/pnhs-logo.png" 
                  alt="PNHS Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold text-green-800 leading-tight">
              Pantabangan National<br />High School
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-green-600 to-yellow-500 mx-auto rounded-full"></div>
            <p className="text-xl text-green-700 font-semibold">ACCESS Portal</p>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Villarica, Pantabangan, Nueva Ecija
            </p>
            <p className="text-sm text-gray-500 italic">Est. 1996 • R.A. 7746</p>
          </div>

          <div className="flex items-center space-x-3 text-green-700 mt-8">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold border-2 border-white">A</div>
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold border-2 border-white">C</div>
              <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold border-2 border-white">C</div>
            </div>
            <span className="font-semibold">Academic Content & Community Enhancement System</span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:max-w-none">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full blur-xl opacity-40"></div>
              <div className="relative w-full h-full rounded-full shadow-xl overflow-hidden">
                <img 
                  src="/pnhs-logo.png" 
                  alt="PNHS Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-1">PNHS ACCESS</h1>
            <p className="text-gray-600 text-sm sm:text-base">Pantabangan National High School</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-green-100">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Please sign in to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start space-x-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-semibold text-sm">Login Failed</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800 placeholder-gray-400"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800 placeholder-gray-400"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-green-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-green-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gradient-to-br from-yellow-50 to-green-50 rounded-xl border-2 border-green-200">
              <p className="text-sm font-bold text-green-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
                Demo Credentials
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                  <span className="font-semibold text-gray-700">Admin:</span>
                  <code className="text-green-700 bg-green-100 px-2 py-1 rounded">admin / admin123</code>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                  <span className="font-semibold text-gray-700">Teacher:</span>
                  <code className="text-green-700 bg-green-100 px-2 py-1 rounded">teacher1 / teacher123</code>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                  <span className="font-semibold text-gray-700">Student:</span>
                  <code className="text-green-700 bg-green-100 px-2 py-1 rounded">student1 / student123</code>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
              <span className="ml-2">Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}