import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function TeacherClassesPage() {
  const session = await getSession()
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.userId },
    include: {
      classes: {
        include: { subject: true, students: { include: { user: true } } }
      }
    }
  })

  return (
    <div>
      <TopBar title="My Classes" subtitle={`${teacher?.classes.length || 0} classes assigned`} />
      <div className="p-8 space-y-6">
        {teacher?.classes.map(c => (
          <div key={c.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-gray-900">{c.name}</h2>
                <p className="text-gray-500 text-sm">{c.subject.name} ({c.subject.code}) {c.schedule && `• ${c.schedule}`}</p>
              </div>
              <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">{c.students.length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-sm font-semibold text-gray-600">Student ID</th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-600">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {c.students.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs text-gray-500">{s.studentId}</td>
                      <td className="py-2 font-medium text-gray-800 text-sm">{s.user.name}</td>
                      <td className="py-2 text-gray-500 text-sm">{s.section}</td>
                    </tr>
                  ))}
                  {c.students.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-sm">No students enrolled</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!teacher?.classes.length && <div className="card text-center text-gray-400 py-16">No classes assigned yet.</div>}
      </div>
    </div>
  )
}
