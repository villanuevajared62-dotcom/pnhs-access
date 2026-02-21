const { PrismaClient } = require("@prisma/client");
(async () => {
  const prisma = new PrismaClient();
  try {
    const id = "cmlr9a9p4000mvd85xie42hbx";
    const data = {
      name: "Jana Reign Barcelo",
      email: "jana.barcelotest@pnhs.edu.ph",
      username: "janab",
      gradeLevel: "Grade 12",
      section: "A",
      strand: "STEM",
    };
    console.log("Attempting update", { id, data });
    const updated = await prisma.student.update({ where: { id }, data });
    console.log("Updated:", updated);
  } catch (e) {
    console.error("Prisma error:", e.message, e);
  } finally {
    await prisma.$disconnect();
  }
})();
