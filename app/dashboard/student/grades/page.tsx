import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function StudentGradesPage() {
  const session = await getSession()
  const student = await prisma.student.findUnique({ where: { userId: session!.userId } })
  const grades = student ? await prisma.grade.findMany({
    where: { studentId: student.id },
    include: { class: { include: { subject: true } } },
    orderBy: [{ class: { subject: { name: 'asc' } } }, { quarter: 'asc' }]
  }) : []

  // Group by subject
  const bySubject: Record<string, typeof grades> = {}
  for (const g of grades) {
    const key = g.class.subject.name
    if (!bySubject[key]) bySubject[key] = []
    bySubject[key].push(g)
  }

  return (
    <div>
      <TopBar title="My Grades" subtitle="Academic performance by quarter" />
      <div className="p-8 space-y-6">
        {Object.entries(bySubject).map(([subject, subGrades]) => {
          const avg = subGrades.reduce((a, g) => a + g.score, 0) / subGrades.length
          return (
            <div key={subject} className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-gray-900">{subject}</h2>
                <div className={`font-bold text-lg px-4 py-1 rounded-xl ${avg >= 85 ? 'bg-green-100 text-green-700' : avg >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  Avg: {avg.toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(q => {
                  const g = subGrades.find(g => g.quarter === q)
                  return (
                    <div key={q} className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">Q{q}</div>
                      {g ? (
                        <>
                          <div className={`text-2xl font-bold ${g.score >= 75 ? 'text-green-600' : 'text-red-600'}`}>{g.score}</div>
                          <div className={`text-xs mt-1 font-medium ${g.score >= 75 ? 'text-green-500' : 'text-red-500'}`}>{g.remarks || (g.score >= 75 ? 'Passed' : 'Failed')}</div>
                        </>
                      ) : <div className="text-gray-300 text-2xl">—</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {grades.length === 0 && <div className="card text-center text-gray-400 py-16">No grades recorded yet.</div>}
      </div>
    </div>
  )
}
