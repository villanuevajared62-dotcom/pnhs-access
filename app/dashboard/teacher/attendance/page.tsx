'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'

interface ClassInfo { id: string; name: string; subject: { name: string }; students: { id: string; studentId: string; user: { name: string } }[] }

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/teacher/classes').then(r => r.json()).then(d => {
      setClasses(Array.isArray(d) ? d : [])
      if (d[0]) { setSelectedClass(d[0].id); initStatuses(d[0]) }
    })
  }, [])

  function initStatuses(cls: ClassInfo) {
    const init: Record<string, string> = {}
    cls.students.forEach(s => { init[s.id] = 'present' })
    setStatuses(init)
  }

  useEffect(() => {
    const cls = classes.find(c => c.id === selectedClass)
    if (cls) initStatuses(cls)
    if (selectedClass && date) {
      fetch(`/api/teacher/attendance?classId=${selectedClass}&date=${date}`).then(r => r.json()).then(d => {
        if (Array.isArray(d) && d.length > 0) {
          const loaded: Record<string, string> = {}
          d.forEach((a: { studentId: string; status: string }) => { loaded[a.studentId] = a.status })
          setStatuses(loaded)
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, date])

  async function saveAttendance() {
    const cls = classes.find(c => c.id === selectedClass)
    if (!cls) return
    const records = cls.students.map(s => ({ studentId: s.id, status: statuses[s.id] || 'present' }))
    const res = await fetch('/api/teacher/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records, classId: selectedClass, date }) })
    if (res.ok) setMsg('Attendance saved!')
    else setMsg('Error saving attendance')
  }

  const cls = classes.find(c => c.id === selectedClass)
  const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused']
  const statusColors: Record<string, string> = { present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-yellow-500', excused: 'bg-blue-500' }

  return (
    <div>
      <TopBar title="Attendance" subtitle="Record daily student attendance" />
      <div className="p-8">
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-48">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{msg}</div>}

        {cls && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-gray-900">{cls.name}</h2>
                <p className="text-gray-500 text-sm">{date} • {cls.students.length} students</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { const all: Record<string, string> = {}; cls.students.forEach(s => { all[s.id] = 'present' }); setStatuses(all) }} className="text-sm text-green-600 hover:underline">Mark All Present</button>
                <button onClick={saveAttendance} className="btn-primary text-sm">💾 Save</button>
              </div>
            </div>
            <div className="space-y-2">
              {cls.students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColors[statuses[s.id] || 'present']}`} />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{s.user.name}</div>
                      <div className="text-xs text-gray-400">{s.studentId}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(st => (
                      <button key={st} onClick={() => setStatuses({...statuses, [s.id]: st})}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${statuses[s.id] === st ? `badge-${st} ring-2 ring-offset-1` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!cls && <div className="card text-center text-gray-400 py-16">No classes available.</div>}
      </div>
    </div>
  )
}
