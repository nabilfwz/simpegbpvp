const http = require("http");

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("-> Testing UI routes with Admin Session...");
  const csrfRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/auth/csrf",
    method: "GET",
  });
  const csrfData = JSON.parse(csrfRes.body);
  const csrfToken = csrfData.csrfToken;
  const rawCookie = csrfRes.headers["set-cookie"]
    ? csrfRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
    : "";

  const loginBody = new URLSearchParams({
    csrfToken,
    email: "admin@bpvp.local",
    password: "admin123",
    callbackUrl: "http://127.0.0.1:3000/",
    json: "true",
  }).toString();

  const loginRes = await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(loginBody),
        Cookie: rawCookie,
      },
    },
    loginBody
  );

  const authCookies = (loginRes.headers["set-cookie"] || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  const sessionCookie = `${rawCookie}; ${authCookies}`;

  const routes = [
    "/login",
    "/",
    "/pegawai",
    "/pegawai/tambah",
    "/admin/master-data",
    "/admin/log-aktivitas",
    "/admin/users",
  ];

  for (const r of routes) {
    const res = await request({
      hostname: "127.0.0.1",
      port: 3000,
      path: r,
      method: "GET",
      headers: { Cookie: sessionCookie },
    });
    console.log(`   Route ${r.padEnd(22)}: HTTP ${res.statusCode} ${res.statusCode === 200 ? "OK" : "FAILED"}`);
    if (res.statusCode !== 200) {
      throw new Error(`Route ${r} returned non-200 status code: ${res.statusCode}`);
    }
  }

  console.log("-> All UI routes rendered HTTP 200 OK successfully!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
