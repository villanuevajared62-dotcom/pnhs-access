'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'

interface Ann { id: string; title: string; content: string; audience: string; createdAt: string }

export default function AnnouncementsPage() {
  const [anns, setAnns] = useState<Ann[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', audience: 'all' })
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAnns() }, [])

  async function fetchAnns() {
    const res = await fetch('/api/announcements')
    const data = await res.json()
    setAnns(Array.isArray(data) ? data : [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setMsg('Posted!'); setShowForm(false); setForm({ title: '', content: '', audience: 'all' }); fetchAnns() }
    else setMsg('Error posting')
  }

  const audienceColors: Record<string, string> = { all: 'bg-green-100 text-green-700', teachers: 'bg-blue-100 text-blue-700', students: 'bg-yellow-100 text-yellow-700' }

  return (
    <div>
      <TopBar title="Announcements" subtitle="Post and manage school announcements" />
      <div className="p-8">
        {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{msg}</div>}
        <div className="flex justify-end mb-6">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">📣 New Announcement</button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="font-display font-bold text-gray-900 mb-4">New Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="all">Everyone</option>
                  <option value="teachers">Teachers only</option>
                  <option value="students">Students only</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary text-sm">Post Announcement</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {anns.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${audienceColors[a.audience]}`}>{a.audience}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
          {anns.length === 0 && <div className="card text-center text-gray-400 py-10">No announcements yet. Post one!</div>}
        </div>
      </div>
    </div>
  )
}
