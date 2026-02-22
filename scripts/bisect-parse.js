const fs = require("fs");
const cp = require("child_process");
const lines = fs
  .readFileSync("app/teacher/dashboard/page.tsx", "utf8")
  .split("\n");
let lo = 1,
  hi = lines.length,
  bad = hi;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  const content = lines.slice(0, mid).join("\n");
  fs.writeFileSync("scripts/_tmp_page.tsx", content, "utf8");
  try {
    cp.execSync("npx tsc --noEmit scripts/_tmp_page.tsx", { stdio: "ignore" });
    // parsed ok
    lo = mid + 1;
  } catch (e) {
    bad = mid;
    hi = mid - 1;
  }
}
console.log("First failing line:", bad);
console.log("Context:");
console.log(lines.slice(Math.max(0, bad - 10), bad + 5).join("\n"));
