import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: { user: true, classes: { include: { subject: true } } },
    orderBy: { user: { name: 'asc' } }
  })

  return (
    <div>
      <TopBar title="Teachers" subtitle={`${teachers.length} registered teachers`} />
      <div className="p-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                  {t.user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{t.user.name}</div>
                  <div className="text-xs text-gray-500">@{t.user.username}</div>
                </div>
              </div>
              {t.department && <div className="text-sm text-gray-600 mb-2">📚 {t.department}</div>}
              <div className="text-xs text-gray-400">{t.classes.length} class{t.classes.length !== 1 ? 'es' : ''}</div>
              {t.classes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.classes.map(c => (
                    <span key={c.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.subject.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
