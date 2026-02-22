import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function StudentAttendancePage() {
  const session = await getSession()
  const student = await prisma.student.findUnique({ where: { userId: session!.userId } })
  const attendance = student ? await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: { class: { include: { subject: true } } },
    orderBy: { date: 'desc' }
  }) : []

  const summary = { present: 0, absent: 0, late: 0, excused: 0 }
  attendance.forEach(a => { summary[a.status as keyof typeof summary]++ })
  const total = attendance.length
  const rate = total > 0 ? ((summary.present / total) * 100).toFixed(1) : '0'

  return (
    <div>
      <TopBar title="Attendance Record" subtitle="Your daily attendance history" />
      <div className="p-8">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="card text-center col-span-1">
            <div className="text-3xl font-bold text-green-700">{rate}%</div>
            <div className="text-xs text-gray-500 mt-1">Attendance Rate</div>
          </div>
          {Object.entries(summary).map(([status, count]) => (
            <div key={status} className="card text-center">
              <div className={`text-2xl font-bold ${status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : status === 'late' ? 'text-yellow-600' : 'text-blue-600'}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-1 capitalize">{status}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-gray-900 mb-4">Attendance Log</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Subject</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-800">{a.date}</td>
                    <td className="py-3 text-sm text-gray-600">{a.class.subject.name}</td>
                    <td className="py-3">
                      <span className={`badge-${a.status}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">No attendance records.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
