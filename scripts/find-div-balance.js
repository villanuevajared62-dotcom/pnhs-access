const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const lines = s.split("\n");
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>|$)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += opens - closes;
  if (opens - closes !== 0) {
    console.log(`${i + 1}: opens=${opens} closes=${closes} balance=${balance}`);
    console.log("  >>", line.trim());
  }
}
console.log("\nFINAL balance:", balance);
