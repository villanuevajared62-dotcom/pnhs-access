'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'

interface User { id: string; username: string; role: string; name: string; email: string; createdAt: string }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', role: 'student', gradeLevel: '7', section: 'A', department: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { setMsg('User created!'); setShowForm(false); fetchUsers(); setForm({ username: '', password: '', name: '', email: '', role: 'student', gradeLevel: '7', section: 'A', department: '' }) }
    else setMsg(data.error || 'Error creating user')
  }

  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-700', teacher: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' }

  return (
    <div>
      <TopBar title="User Management" subtitle="Manage all system users" />
      <div className="p-8">
        {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{msg}</div>}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">{users.length} total users</div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">➕ Add User</button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-display font-bold text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === 'student' && <>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label><input value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Section</label><input value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
              </>}
              {form.role === 'teacher' && <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>}
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary text-sm">Create User</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {loading ? <div className="text-center py-10 text-gray-400">Loading users...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Username</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Role</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800 text-sm">{u.name}</td>
                      <td className="py-3 text-gray-600 text-sm font-mono">{u.username}</td>
                      <td className="py-3"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span></td>
                      <td className="py-3 text-gray-500 text-sm">{u.email || '—'}</td>
                      <td className="py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
