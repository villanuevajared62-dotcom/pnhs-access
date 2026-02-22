import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function TeacherAnnouncementsPage() {
  const session = await getSession()
  const announcements = await prisma.announcement.findMany({
    where: { OR: [{ audience: 'all' }, { audience: 'teachers' }] },
    orderBy: { createdAt: 'desc' }
  })

  const audienceColors: Record<string, string> = { all: 'bg-green-100 text-green-700', teachers: 'bg-blue-100 text-blue-700', students: 'bg-yellow-100 text-yellow-700' }

  return (
    <div>
      <TopBar title="Announcements" subtitle="School-wide announcements" />
      <div className="p-8">
        <div className="space-y-4">
          {announcements.map(a => (
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
          {announcements.length === 0 && <div className="card text-center text-gray-400 py-10">No announcements yet.</div>}
        </div>
      </div>
    </div>
  )
}
