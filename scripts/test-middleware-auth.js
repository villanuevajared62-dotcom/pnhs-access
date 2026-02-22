const crypto = require("crypto");
const fs = require("fs");

(async () => {
  // 1) Test login API with demo admin credentials
  try {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const loginText = await loginRes.text();
    console.log("login status:", loginRes.status);
    console.log("login body:", loginText);
  } catch (e) {
    console.error("login fetch error:", e);
  }

  // 2) Build a minimal admin user payload and cookie for middleware/API tests
  const user = {
    id: "1",
    username: "admin",
    role: "admin",
    fullName: "Administrator",
    createdAt: new Date().toISOString(),
  };

  const payload = JSON.stringify(user);
  const b64 = Buffer.from(payload, "utf8").toString("base64");
  const secret = process.env.SESSION_SECRET || "dev_session_secret";
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("base64");
  const signed = `${b64}.${sig}`;

  const tokenCookie = ""; // no DB token in local mode
  // Use raw JSON for Edge middleware compatibility
  const rawJsonCookie = JSON.stringify(user);
  const cookieHeader = `pnhs_session=${rawJsonCookie}; pnhs_session_token=${tokenCookie}`;
  console.log("cookie header to use:", cookieHeader);

  // 3) Validate access to admin dashboard via middleware
  try {
    const res = await fetch("http://localhost:3000/admin/dashboard", {
      headers: { cookie: cookieHeader },
      redirect: "manual",
    });
    console.log("admin dashboard status:", res.status, "location:", res.headers.get("location"));
  } catch (e) {
    console.error("dashboard fetch error:", e);
  }

  // 4) Attempt an assignment upload using the cookie
  try {
    const fd = new FormData();
    const filePath = require("path").join(process.cwd(), "package.json");
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: "application/json" });
    fd.append("file", blob, "package.json");
    fd.append("classId", "");

    const uploadRes = await fetch("http://localhost:3000/api/assignments/upload", {
      method: "POST",
      headers: { cookie: cookieHeader },
      body: fd,
    });
    const text = await uploadRes.text();
    console.log("assignment upload status:", uploadRes.status);
    console.log("assignment upload body:", text);
  } catch (e) {
    console.error("assignment upload error:", e);
  }
})();
