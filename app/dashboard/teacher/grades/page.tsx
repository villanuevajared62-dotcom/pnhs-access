'use client'
import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'

interface ClassInfo { id: string; name: string; subject: { name: string }; students: { id: string; studentId: string; user: { name: string } }[] }
interface Grade { id: string; studentId: string; classId: string; quarter: number; score: number; remarks: string; student: { user: { name: string } }; class: { subject: { name: string } } }

export default function TeacherGradesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedQ, setSelectedQ] = useState(1)
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/teacher/classes').then(r => r.json()).then(d => { setClasses(Array.isArray(d) ? d : []); if (d[0]) setSelectedClass(d[0].id) })
  }, [])

  useEffect(() => {
    if (selectedClass) fetch(`/api/teacher/grades?classId=${selectedClass}`).then(r => r.json()).then(d => setGrades(Array.isArray(d) ? d : []))
  }, [selectedClass])

  const cls = classes.find(c => c.id === selectedClass)
  const quarterGrades = grades.filter(g => g.quarter === selectedQ && g.classId === selectedClass)
  const gradeMap: Record<string, number> = {}
  quarterGrades.forEach(g => { gradeMap[g.studentId] = g.score })

  async function saveGrades() {
    setMsg('')
    const saves = Object.entries(editing).map(([studentId, score]) =>
      fetch('/api/teacher/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, classId: selectedClass, quarter: selectedQ, score, remarks: score >= 75 ? 'Passed' : 'Failed' }) })
    )
    await Promise.all(saves)
    setMsg('Grades saved!'); setEditing({})
    fetch(`/api/teacher/grades?classId=${selectedClass}`).then(r => r.json()).then(d => setGrades(Array.isArray(d) ? d : []))
  }

  return (
    <div>
      <TopBar title="Grade Management" subtitle="Enter and manage student grades" />
      <div className="p-8">
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-48">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <select value={selectedQ} onChange={e => setSelectedQ(Number(e.target.value))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {[1,2,3,4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
              </select>
            </div>
          </div>
        </div>

        {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{msg}</div>}

        {cls && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-gray-900">{cls.name} — Quarter {selectedQ}</h2>
                <p className="text-gray-500 text-sm">{cls.subject.name}</p>
              </div>
              <button onClick={saveGrades} disabled={Object.keys(editing).length === 0} className="btn-primary text-sm disabled:opacity-50">💾 Save Grades</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Student</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-600">Grade (%)</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-600">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.students.map(s => {
                    const score = editing[s.id] !== undefined ? editing[s.id] : (gradeMap[s.id] ?? '')
                    const numScore = typeof score === 'number' ? score : Number(score)
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-800 text-sm">{s.user.name}</td>
                        <td className="py-3 font-mono text-xs text-gray-500">{s.studentId}</td>
                        <td className="py-3 text-center">
                          <input type="number" min={0} max={100} value={score} onChange={e => setEditing({...editing, [s.id]: Number(e.target.value)})}
                            className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </td>
                        <td className="py-3 text-center">
                          {score !== '' && <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${numScore >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {numScore >= 75 ? 'Passed' : 'Failed'}
                          </span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!cls && <div className="card text-center text-gray-400 py-16">No classes available.</div>}
      </div>
    </div>
  )
}
