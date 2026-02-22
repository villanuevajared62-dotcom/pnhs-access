const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const list = await prisma.student.findMany({
    where: { password: null },
    take: 20,
  });
  console.log(
    "students-without-password:",
    JSON.stringify(
      list.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        username: s.username,
      })),
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
