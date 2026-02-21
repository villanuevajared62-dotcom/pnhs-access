const fetch = globalThis.fetch || require("node-fetch");
(async () => {
  const token =
    "4957202417642b980f3e269ffc714d50d22382dcd130d7caa2fe9c5c0e163edc";
  const res = await fetch("http://localhost:3002/api/auth/logout", {
    method: "POST",
    headers: { cookie: "pnhs_session_token=" + token },
  });
  console.log("logout status", res.status);

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const s = await prisma.session.findUnique({ where: { token } });
  console.log("session after logout:", s);
  await prisma.$disconnect();
})();
