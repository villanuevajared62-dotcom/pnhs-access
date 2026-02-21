const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const tags = [
  "<div",
  "</div>",
  "<select",
  "</select>",
  "<button",
  "</button>",
  "<input",
  "/>",
  "<textarea",
  "</textarea>",
];
for (const t of tags) {
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  console.log(`${t}:`, (s.match(re) || []).length);
}
console.log("\nlast 400 chars:\n", s.slice(-400));
