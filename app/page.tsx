'use client'

import Link from 'next/link'
import { GraduationCap, Users, BookOpen, Shield, ChevronRight, Lock, Award, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-full">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-pnhs-dark">PNHS-ACCESS</h1>
                <p className="text-xs text-gray-600">Pantabangan National High School</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-pnhs-primary hover:text-pnhs-dark font-semibold transition-colors">
                Login
              </Link>
              <Link href="/login" className="btn-primary flex items-center space-x-2">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-pnhs-light rounded-full text-pnhs-dark font-semibold text-sm">
                Academic Excellence Through Technology
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to <span className="text-pnhs-primary">PNHS-ACCESS</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Academic Comprehensive Connectivity Enhanced Student System - Your gateway to seamless education management, secure authentication, and enhanced student services.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/login" className="btn-primary flex items-center space-x-2 text-lg">
                  <Lock className="w-5 h-5" />
                  <span>Login to Portal</span>
                </Link>
                <button className="bg-white hover:bg-gray-50 text-pnhs-primary font-semibold py-3 px-8 rounded-lg border-2 border-pnhs-primary transition-all duration-200 text-lg">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-pnhs-accent/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-pnhs-secondary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center justify-center w-full h-64 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl">
                  <GraduationCap className="w-32 h-32 text-white" />
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Shield className="w-5 h-5 text-pnhs-primary" />
                    <span className="font-semibold">Secure Authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Users className="w-5 h-5 text-pnhs-primary" />
                    <span className="font-semibold">Multi-User Access (Admin & Teachers)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-pnhs-primary" />
                    <span className="font-semibold">Comprehensive Student Services</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need for modern education management</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Access Control</h3>
              <p className="text-gray-600">
                Advanced authentication system with role-based access for administrators, teachers, and students. Your data is protected with industry-standard security.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">User Management</h3>
              <p className="text-gray-600">
                Efficiently manage students, teachers, and administrative staff. Track attendance, grades, and performance with comprehensive dashboards.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Academic Records</h3>
              <p className="text-gray-600">
                Centralized database for grades, attendance, and student information. Real-time updates and easy access for authorized personnel.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Performance Tracking</h3>
              <p className="text-gray-600">
                Monitor student progress with detailed analytics and reporting tools. Generate comprehensive performance reports instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Data-driven insights for better decision making. Visual charts and graphs to understand trends and patterns in student performance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card group hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Teacher Portal</h3>
              <p className="text-gray-600">
                Dedicated interface for teachers to manage classes, submit grades, take attendance, and communicate with students and parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Pantabangan National High School's digital transformation. Access the portal today and experience seamless education management.
          </p>
          <Link href="/login" className="inline-flex items-center space-x-2 bg-white text-pnhs-primary font-bold py-4 px-10 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-xl text-lg">
            <Lock className="w-6 h-6" />
            <span>Access Portal Now</span>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-full">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">PNHS-ACCESS</h3>
                  <p className="text-sm text-gray-400">Pantabangan National High School</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Academic Comprehensive Connectivity Enhanced Student System - Empowering education through technology and innovation.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Pantabangan, Nueva Ecija</li>
                <li>Philippines</li>
                <li className="text-pnhs-accent">support@pnhs.edu.ph</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Pantabangan National High School. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
