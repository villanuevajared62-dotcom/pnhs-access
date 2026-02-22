const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  const s = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(JSON.stringify(s, null, 2));
  await prisma.$disconnect();
})();
