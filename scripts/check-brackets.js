const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const counts = { "(": 0, ")": 0, "{": 0, "}": 0, "[": 0, "]": 0 };
for (const ch of s) if (ch in counts) counts[ch]++;
console.log("counts", counts);
