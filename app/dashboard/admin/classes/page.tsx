import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    include: { subject: true, teacher: { include: { user: true } }, students: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div>
      <TopBar title="Classes" subtitle={`${classes.length} active classes`} />
      <div className="p-8">
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.subject.name} ({c.subject.code})</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">Grade {c.gradeLevel}</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>👨‍🏫 {c.teacher.user.name}</div>
                {c.schedule && <div>🕐 {c.schedule}</div>}
                <div>👥 {c.students.length} student{c.students.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
