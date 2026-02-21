const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  const s = await prisma.session.findFirst({
    where: {},
    orderBy: { createdAt: "desc" },
  });
  console.log("latest session row:", s);
  const user = s ? JSON.parse(s.data) : null;
  const payload = JSON.stringify(
    user || { id: "1", username: "admin", role: "admin" },
  );
  const b64 = Buffer.from(payload, "utf8").toString("base64");
  const secret = process.env.SESSION_SECRET || "dev_session_secret";
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64");
  const signed = `${b64}.${sig}`;
  const tokenCookie = s ? s.token : "";
  console.log("constructed signed cookie:", signed);
  console.log("token cookie:", tokenCookie);

  const cookieHeader = `pnhs_session=${encodeURIComponent(signed)}; pnhs_session_token=${tokenCookie}`;
  console.log("cookie header to use:", cookieHeader);

  const res = await fetch("http://localhost:3000/admin/dashboard", {
    headers: { cookie: cookieHeader },
    redirect: "manual",
  });
  console.log(
    "admin dashboard status:",
    res.status,
    "location:",
    res.headers.get("location"),
  );
  await prisma.$disconnect();
})();
