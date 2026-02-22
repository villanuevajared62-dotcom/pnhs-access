const fs = require("fs");
const s = fs.readFileSync("app/teacher/dashboard/page.tsx", "utf8");
const pairs = { "(": ")", "{": "}", "[": "]" };
const opens = Object.keys(pairs);
const closes = Object.values(pairs);
const stack = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (opens.includes(ch)) stack.push({ ch, i });
  if (closes.includes(ch)) {
    const expected = opens[closes.indexOf(ch)];
    const last = stack.pop();
    if (!last || last.ch !== expected) {
      console.log(
        "Mismatch at index",
        i,
        "char",
        ch,
        "expected",
        pairs[last ? last.ch : "?"],
      );
      break;
    }
  }
}
console.log("Stack leftover:", stack.map((x) => x.ch).join(""));
