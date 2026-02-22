import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function StudentAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { OR: [{ audience: 'all' }, { audience: 'students' }] },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <TopBar title="Announcements" subtitle="School-wide announcements for students" />
      <div className="p-8">
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card border-l-4 border-green-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
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
