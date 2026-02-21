const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const stack = [];
const open = { "(": ")", "{": "}", "[": "]" };
const close = { ")": "(", "}": "{", "]": "[" };
let line = 1;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === "\n") {
    line++;
    continue;
  }
  if (ch in open) stack.push({ ch, line, i });
  else if (ch in close) {
    if (stack.length === 0 || stack[stack.length - 1].ch !== close[ch]) {
      console.log("Unmatched closing", ch, "at line", line);
    } else {
      stack.pop();
    }
  }
}
if (stack.length === 0) console.log("All matched");
else {
  console.log("Unmatched openings (top->bottom):");
  stack.forEach((sitem) => console.log(sitem.ch, "line", sitem.line));
}
