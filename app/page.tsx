<<<<<<< HEAD
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">PNHS</span>
            </div>
            <div>
              <div className="font-bold text-green-800 font-display text-sm">PNHS ACCESS</div>
              <div className="text-xs text-gray-500">Pantabangan National High School</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-green-700 font-semibold hover:text-green-800 transition-colors">Login</Link>
            <Link href="/auth/login" className="btn-primary text-sm">Get Started →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <span>✦</span> Academic Excellence Through Technology
            </div>
            <h1 className="font-display text-5xl font-bold text-gray-900 leading-tight mb-4">
              Welcome to <span className="text-green-700">PNHS</span>{' '}
              <span className="text-yellow-600">ACCESS</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Academic Content & Community Enhancement System — Your gateway to seamless education management, secure authentication, and enhanced student services.
            </p>
            <div className="flex gap-4 mb-10">
              <Link href="/auth/login" className="btn-primary">🔒 Login to Portal</Link>
              <a href="#features" className="btn-secondary">Learn More</a>
            </div>
            <div className="flex gap-10">
              <div><div className="font-display font-bold text-2xl text-green-700">1000+</div><div className="text-sm text-gray-500">Students</div></div>
              <div><div className="font-display font-bold text-2xl text-green-700">50+</div><div className="text-sm text-gray-500">Teachers</div></div>
              <div><div className="font-display font-bold text-2xl text-yellow-600">Est. 1996</div><div className="text-sm text-gray-500">Since</div></div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="bg-gradient-to-br from-green-700 to-yellow-600 rounded-2xl h-52 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">🏫</div>
                  <div className="text-white font-bold font-display">Pantabangan NHS</div>
                  <div className="text-green-100 text-sm">R.A. 7746 • Est. 1996</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🛡️', label: 'Secure Authentication', color: 'bg-green-50' },
                  { icon: '👥', label: 'Multi-User Access', color: 'bg-yellow-50' },
                  { icon: '📚', label: 'Comprehensive Services', color: 'bg-green-50' },
                ].map(f => (
                  <div key={f.label} className={`${f.color} rounded-xl px-4 py-3 flex items-center gap-3`}>
                    <span className="text-xl">{f.icon}</span>
                    <span className="font-medium text-gray-700 text-sm">{f.label}</span>
                  </div>
                ))}
=======
'use client'

import Link from 'next/link'
import { GraduationCap, Users, BookOpen, Shield, ChevronRight, Lock, Award, TrendingUp, CheckCircle, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md shadow-lg z-50 border-b-2 border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full shadow-lg overflow-hidden">
                <img 
                  src="/pnhs-logo.png" 
                  
                  alt="PNHS Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-800">PNHS ACCESS</h1>
                <p className="text-xs text-gray-600">Pantabangan National High School</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hidden sm:block text-green-700 hover:text-green-900 font-semibold transition-colors">
                Login
              </Link>
              <Link href="/login" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border-4 border-green-600 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 border-4 border-yellow-500 rounded-full animate-pulse delay-150"></div>
          <BookOpen className="absolute top-1/3 right-1/4 w-32 h-32 text-green-600 opacity-20 animate-bounce" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-yellow-100 rounded-full text-green-800 font-semibold text-sm border-2 border-green-200">
                <Sparkles className="w-4 h-4" />
                <span>Academic Excellence Through Technology</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-green-900 leading-tight">
                Welcome to <span className="bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">PNHS ACCESS</span>
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Academic Content & Community Enhancement System - Your gateway to seamless education management, secure authentication, and enhanced student services.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2 text-lg">
                  <Lock className="w-5 h-5" />
                  <span>Login to Portal</span>
                </Link>
                <button className="bg-white hover:bg-green-50 text-green-700 font-semibold py-4 px-8 rounded-xl border-2 border-green-600 transition-all duration-200 text-lg shadow-md hover:shadow-lg">
                  Learn More
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">1000+</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">50+</div>
                  <div className="text-sm text-gray-600">Teachers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">Est. 1996</div>
                  <div className="text-sm text-gray-600">Since</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-2 border-green-100">
                <div className="flex items-center justify-center w-full h-64 bg-gradient-to-br from-green-600 to-yellow-500 rounded-2xl shadow-inner mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <img 
                    src="/pnhs-logo.png" 
                    alt="PNHS Logo" 
                    className="w-48 h-48 object-contain relative z-10"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">Secure Authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">Multi-User Access</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">Comprehensive Services</span>
                  </div>
                </div>
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
              </div>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">Powerful Features</h2>
            <p className="text-gray-500">Modern tools for seamless education management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Secure Access Control', desc: 'Advanced authentication system with role-based access for administrators, teachers, and students.', tag: 'Enterprise-grade security', color: 'bg-green-600' },
              { icon: '👥', title: 'User Management', desc: 'Efficiently manage students, teachers, and administrative staff. Track attendance, grades, and performance.', tag: 'Streamlined workflows', color: 'bg-yellow-500' },
              { icon: '📖', title: 'Academic Records', desc: 'Centralized database for grades, attendance, and student information. Real-time updates and easy access.', tag: 'Instant access anywhere', color: 'bg-green-600' },
              { icon: '🏆', title: 'Performance Tracking', desc: 'Monitor student progress with detailed analytics and reporting tools. Generate comprehensive performance reports.', tag: 'Data-driven insights', color: 'bg-yellow-500' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Data-driven insights for better decision making. Visual charts and graphs to understand trends.', tag: 'Smart analytics', color: 'bg-yellow-500' },
              { icon: '🎓', title: 'Teacher Portal', desc: 'Dedicated interface for teachers to manage classes, submit grades, take attendance, and communicate.', tag: 'Easy to use', color: 'bg-green-600' },
            ].map(f => (
              <div key={f.title} className="card hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
                <h3 className="font-display font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <span>✓</span> {f.tag}
                </div>
              </div>
            ))}
=======
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full text-green-800 font-semibold text-sm mb-4">
              <Award className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">Modern tools for seamless education management</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">Secure Access Control</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced authentication system with role-based access for administrators, teachers, and students. Your data is protected with industry-standard security.
              </p>
              <div className="mt-4 flex items-center text-green-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Enterprise-grade security</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">User Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Efficiently manage students, teachers, and administrative staff. Track attendance, grades, and performance with comprehensive dashboards.
              </p>
              <div className="mt-4 flex items-center text-yellow-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Streamlined workflows</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">Academic Records</h3>
              <p className="text-gray-600 leading-relaxed">
                Centralized database for grades, attendance, and student information. Real-time updates and easy access for authorized personnel.
              </p>
              <div className="mt-4 flex items-center text-green-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Instant access anywhere</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">Performance Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor student progress with detailed analytics and reporting tools. Generate comprehensive performance reports instantly.
              </p>
              <div className="mt-4 flex items-center text-yellow-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Data-driven insights</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Data-driven insights for better decision making. Visual charts and graphs to understand trends and patterns in student performance.
              </p>
              <div className="mt-4 flex items-center text-green-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Smart analytics</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-yellow-100 group hover:scale-105">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-3">Teacher Portal</h3>
              <p className="text-gray-600 leading-relaxed">
                Dedicated interface for teachers to manage classes, submit grades, take attendance, and communicate with students and parents.
              </p>
              <div className="mt-4 flex items-center text-yellow-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Easy to use</span>
              </div>
            </div>
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* CTA */}
      <section className="gradient-footer py-20 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span>✦</span> Join Us Today
          </div>
          <h2 className="font-display text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-green-100 text-lg mb-8">Join Pantabangan National High School&apos;s digital transformation. Access the portal today and experience seamless education management.</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors">
            🔒 Access Portal Now →
=======
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-green-700 to-yellow-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 right-20 w-64 h-64 border-4 border-white rounded-full"></div>
            <div className="absolute bottom-10 left-20 w-80 h-80 border-4 border-white rounded-full"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-full text-white font-semibold text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Join Us Today</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-green-50 mb-8 leading-relaxed">
            Join Pantabangan National High School's digital transformation. Access the portal today and experience seamless education management.
          </p>
          <Link href="/login" className="inline-flex items-center space-x-3 bg-white text-green-700 font-bold py-4 px-10 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-2xl text-lg group">
            <Lock className="w-6 h-6" />
            <span>Access Portal Now</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
          </Link>
        </div>
      </section>

      {/* Footer */}
<<<<<<< HEAD
      <footer className="bg-green-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div>
            <div className="font-display font-bold text-lg mb-1">PNHS ACCESS</div>
            <div className="text-green-400 text-sm mb-3">Pantabangan National High School</div>
            <p className="text-green-200 text-sm leading-relaxed">Academic Content & Community Enhancement System — Empowering education through technology and innovation since 1996.</p>
            <p className="text-green-400 text-sm mt-2">Villarica, Pantabangan, Nueva Ecija</p>
          </div>
          <div>
            <div className="font-semibold text-yellow-400 mb-3">Quick Links</div>
            <ul className="space-y-2 text-sm text-green-200">
              <li><Link href="/auth/login" className="hover:text-white">› Login</Link></li>
              <li><a href="#features" className="hover:text-white">› Features</a></li>
              <li><a href="#" className="hover:text-white">› About</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-yellow-400 mb-3">Contact</div>
            <div className="text-green-200 text-sm space-y-1">
              <p>Pantabangan, Nueva Ecija</p>
              <p>Philippines</p>
              <p className="text-yellow-400 font-semibold">R.A. 7746</p>
            </div>
          </div>
        </div>
        <div className="border-t border-green-800 mt-10 pt-6 text-center text-green-400 text-sm">
          <p>© 2026 Pantabangan National High School. All rights reserved.</p>
          <p className="mt-1">Established 1996 • Empowering Future Leaders</p>
        </div>
      </footer>
    </div>
  )
}
=======
      <footer className="bg-gradient-to-br from-green-900 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full shadow-lg overflow-hidden bg-white p-1">
                  <img 
                    src="/pnhs-logo.png" 
                    alt="PNHS Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">PNHS ACCESS</h3>
                  <p className="text-sm text-green-200">Pantabangan National High School</p>
                </div>
              </div>
              <p className="text-green-100 mb-4 leading-relaxed">
                Academic Content & Community Enhancement System - Empowering education through technology and innovation since 1996.
              </p>
              <p className="text-sm text-green-200">Villarica, Pantabangan, Nueva Ecija</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-yellow-300">Quick Links</h4>
              <ul className="space-y-2 text-green-100">
                <li><Link href="/login" className="hover:text-yellow-300 transition-colors flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4" />
                  <span>Login</span>
                </Link></li>
                <li><a href="#features" className="hover:text-yellow-300 transition-colors flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4" />
                  <span>Features</span>
                </a></li>
                <li><a href="#about" className="hover:text-yellow-300 transition-colors flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4" />
                  <span>About</span>
                </a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-yellow-300">Contact</h4>
              <ul className="space-y-2 text-green-100">
                <li>Pantabangan, Nueva Ecija</li>
                <li>Philippines</li>
                <li className="text-yellow-300 font-semibold">R.A. 7746</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-green-700 mt-8 pt-8 text-center text-green-200">
            <p>&copy; 2026 Pantabangan National High School. All rights reserved.</p>
            <p className="text-sm mt-2">Established 1996 • Empowering Future Leaders</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
