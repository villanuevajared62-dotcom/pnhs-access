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
              </div>
            </div>
          </div>
        </div>
      </section>

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
          </div>
        </div>
      </section>

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
          </Link>
        </div>
      </section>

      {/* Footer */}
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
