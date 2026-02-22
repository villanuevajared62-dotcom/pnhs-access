import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function ReportsPage() {
  const [grades, attendance] = await Promise.all([
    prisma.grade.findMany({ include: { student: { include: { user: true } }, class: { include: { subject: true } } }, orderBy: { quarter: 'asc' } }),
    prisma.attendance.groupBy({ by: ['status'], _count: { id: true } }),
  ])

  // Compute averages per student
  const studentMap: Record<string, { name: string; total: number; count: number }> = {}
  for (const g of grades) {
    const key = g.student.id
    if (!studentMap[key]) studentMap[key] = { name: g.student.user.name, total: 0, count: 0 }
    studentMap[key].total += g.score
    studentMap[key].count++
  }
  const studentAvgs = Object.values(studentMap).map(s => ({ ...s, avg: s.total / s.count })).sort((a, b) => b.avg - a.avg)

  const attendanceSummary = attendance.reduce((acc, a) => { acc[a.status] = a._count.id; return acc }, {} as Record<string, number>)

  return (
    <div>
      <TopBar title="Reports & Analytics" subtitle="Academic performance overview" />
      <div className="p-8 space-y-6">
        {/* Attendance Overview */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 mb-4">📊 Attendance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['present', 'absent', 'late', 'excused'].map(s => (
              <div key={s} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{attendanceSummary[s] || 0}</div>
                <div className={`text-sm font-medium capitalize mt-1 badge-${s} inline-block`}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 mb-4">🏆 Student Performance Rankings</h2>
          <div className="space-y-2">
            {studentAvgs.slice(0, 10).map((s, i) => (
              <div key={s.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{s.name}</div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${s.avg >= 85 ? 'bg-green-500' : s.avg >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(s.avg, 100)}%` }} />
                  </div>
                </div>
                <div className={`font-bold text-sm ${s.avg >= 85 ? 'text-green-600' : s.avg >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{s.avg.toFixed(1)}%</div>
              </div>
            ))}
            {studentAvgs.length === 0 && <p className="text-gray-400 text-sm">No grade data available.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
