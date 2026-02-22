import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'

export default async function StudentProfilePage() {
  const session = await getSession()
  const student = await prisma.student.findUnique({
    where: { userId: session!.userId },
    include: { user: true, class: { include: { subject: true, teacher: { include: { user: true } } } } }
  })

  return (
    <div>
      <TopBar title="My Profile" subtitle="Your student information" />
      <div className="p-8">
        <div className="max-w-2xl">
          <div className="card mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">
                {student?.user.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-gray-900">{student?.user.name}</h2>
                <p className="text-gray-500">{student?.studentId}</p>
                <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">Student</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Username', value: student?.user.username },
                { label: 'Email', value: student?.user.email || 'Not set' },
                { label: 'Grade Level', value: `Grade ${student?.gradeLevel}` },
                { label: 'Section', value: student?.section },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{f.label}</div>
                  <div className="font-semibold text-gray-800">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {student?.class && (
            <div className="card">
              <h3 className="font-display font-bold text-gray-900 mb-4">📚 Enrolled Class</h3>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="font-semibold text-gray-900">{student.class.name}</div>
                <div className="text-sm text-gray-600 mt-1">Subject: {student.class.subject.name} ({student.class.subject.code})</div>
                <div className="text-sm text-gray-600">Teacher: {student.class.teacher.user.name}</div>
                {student.class.schedule && <div className="text-sm text-gray-500 mt-1">🕐 {student.class.schedule}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
