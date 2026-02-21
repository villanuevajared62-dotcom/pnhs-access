const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const students = await prisma.student.findMany({ take: 20 });
    console.log(
      "STUDENTS:",
      students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        section: s.section,
        strand: s.strand,
      })),
    );
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
