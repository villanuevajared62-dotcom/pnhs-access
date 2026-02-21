// scripts/prisma-migrate-data.js
// Simple migration script to convert Teacher.subjects JSON string into Subject and TeacherSubject rows.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log(
    "Starting data migration: Teacher.subjects -> Subject + TeacherSubject",
  );

  const teachers = await prisma.teacher.findMany();
  for (const t of teachers) {
    try {
      const raw = t.subjects || "[]";
      let list = [];
      try {
        list = JSON.parse(raw);
      } catch (e) {
        list = [];
      }
      for (const name of list) {
        if (!name || typeof name !== "string") continue;
        const trimmed = name.trim();
        if (!trimmed) continue;
        // upsert subject
        let subject = await prisma.subject
          .findUnique({ where: { name: trimmed } })
          .catch(() => null);
        if (!subject) {
          subject = await prisma.subject.create({ data: { name: trimmed } });
          console.log("Created subject", trimmed);
        }
        // create teacherSubject if not exists
        const exists = await prisma.teacherSubject
          .findUnique({
            where: {
              teacherId_subjectId: { teacherId: t.id, subjectId: subject.id },
            },
          })
          .catch(() => null);
        if (!exists) {
          await prisma.teacherSubject.create({
            data: { teacherId: t.id, subjectId: subject.id },
          });
          console.log(`Linked teacher ${t.id} -> subject ${subject.name}`);
        }
      }
    } catch (e) {
      console.error("Error migrating teacher", t.id, e);
    }
  }

  console.log("Migration complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
