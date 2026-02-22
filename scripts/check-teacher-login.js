const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.teacher.findFirst({
    where: { email: { startsWith: "santos@" } },
  });
  console.log("teacher:", JSON.stringify(teacher, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
