const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const lines = s.split("\n");
let cum = 0;
let maxCum = -Infinity;
let maxLine = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === "(") cum++;
    else if (ch === ")") cum--;
  }
  if (cum > maxCum) {
    maxCum = cum;
    maxLine = i + 1;
  }
}
console.log("final cum", cum, "maxCum", maxCum, "maxLine", maxLine);
for (
  let i = Math.max(1, maxLine - 6);
  i <= Math.min(lines.length, maxLine + 6);
  i++
) {
  console.log(i + ":", lines[i - 1]);
}
