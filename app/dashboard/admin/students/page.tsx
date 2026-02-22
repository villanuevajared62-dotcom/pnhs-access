import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: { user: true, class: { include: { subject: true } } },
    orderBy: { user: { name: 'asc' } }
  })

  return (
    <div>
      <TopBar title="Students" subtitle={`${students.length} enrolled students`} />
      <div className="p-8">
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Student ID</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Grade</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Section</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Class</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-gray-500">{s.studentId}</td>
                    <td className="py-3 font-medium text-gray-800 text-sm">{s.user.name}</td>
                    <td className="py-3 text-sm text-gray-600">Grade {s.gradeLevel}</td>
                    <td className="py-3 text-sm text-gray-600">{s.section}</td>
                    <td className="py-3 text-sm text-gray-500">{s.class?.subject.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
