const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const list = await prisma.teacher.findMany({ where: { password: null } });
  console.log("teachers-without-password:", JSON.stringify(list, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
