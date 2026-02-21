const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  const t = await prisma.teacher.findMany({ take: 10 });
  console.log(JSON.stringify(t, null, 2));
  await prisma.$disconnect();
})();
