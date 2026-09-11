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
  console.log("=== STEP 1: VERIFY LOGIN & SSO PAGE RENDERING ===");
  const loginRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/login",
    method: "GET",
  });
  console.log(`-> GET /login: HTTP ${loginRes.statusCode}`);
  if (loginRes.statusCode !== 200) throw new Error("GET /login failed");
  if (!loginRes.body.includes("SSO Kemnaker")) {
    throw new Error("SSO Kemnaker button not found on /login!");
  }
  console.log("-> /login contains SSO Kemnaker button.");

  const ssoPageRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/sso/kemnaker",
    method: "GET",
  });
  console.log(`-> GET /sso/kemnaker: HTTP ${ssoPageRes.statusCode}`);
  if (ssoPageRes.statusCode !== 200) throw new Error("GET /sso/kemnaker failed");
  console.log("-> /sso/kemnaker rendered successfully.");

  console.log("\n=== STEP 2: SSO AUTHENTICATION (EXISTING ADMIN) ===");
  const csrfRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/auth/csrf",
    method: "GET",
  });
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;
  const rawCookie = csrfRes.headers["set-cookie"]
    ? csrfRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
    : "";

  const ssoAdminBody = new URLSearchParams({
    csrfToken,
    email: "admin@bpvp.local",
    nama: "Administrator BPVP",
    nip: "198001012005011001",
    role: "admin",
    callbackUrl: "http://127.0.0.1:3000/",
    json: "true",
  }).toString();

  const ssoAdminRes = await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/auth/callback/sso-kemnaker",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(ssoAdminBody),
        Cookie: rawCookie,
      },
    },
    ssoAdminBody
  );
  console.log(`-> SSO Login Admin HTTP Status: ${ssoAdminRes.statusCode}`);
  const adminAuthCookies = (ssoAdminRes.headers["set-cookie"] || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  const adminSessionCookie = `${rawCookie}; ${adminAuthCookies}`;

  // Check session
  const adminSessionRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/auth/session",
    method: "GET",
    headers: { Cookie: adminSessionCookie },
  });
  const adminSession = JSON.parse(adminSessionRes.body);
  console.log("-> Admin Session:", adminSession.user);
  if (adminSession.user?.role !== "admin") {
    throw new Error("Expected role admin in session!");
  }

  console.log("\n=== STEP 3: SSO AUTO-PROVISIONING (NEW ASN USER) ===");
  const newAsnEmail = "fauzi.asn@kemnaker.go.id";
  const ssoNewAsnBody = new URLSearchParams({
    csrfToken,
    email: newAsnEmail,
    nama: "Ahmad Fauzi, S.T.",
    nip: "199203152020121004",
    role: "operator",
    callbackUrl: "http://127.0.0.1:3000/pegawai",
    json: "true",
  }).toString();

  const ssoNewAsnRes = await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/auth/callback/sso-kemnaker",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(ssoNewAsnBody),
        Cookie: rawCookie,
      },
    },
    ssoNewAsnBody
  );
  console.log(`-> SSO Auto-Provision New ASN HTTP Status: ${ssoNewAsnRes.statusCode}`);
  const newAsnCookies = (ssoNewAsnRes.headers["set-cookie"] || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  const newAsnSessionCookie = `${rawCookie}; ${newAsnCookies}`;

  const newAsnSessionRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/auth/session",
    method: "GET",
    headers: { Cookie: newAsnSessionCookie },
  });
  const newAsnSession = JSON.parse(newAsnSessionRes.body);
  console.log("-> Auto-Provisioned ASN Session:", newAsnSession.user);
  if (newAsnSession.user?.email !== newAsnEmail || newAsnSession.user?.role !== "operator") {
    throw new Error("Auto-provisioned session mismatch!");
  }

  // Verify access to protected route /pegawai with new ASN session
  const pegawaiPageRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/pegawai",
    method: "GET",
    headers: { Cookie: newAsnSessionCookie },
  });
  console.log(`-> Access /pegawai with Auto-Provisioned ASN Session: HTTP ${pegawaiPageRes.statusCode}`);
  if (pegawaiPageRes.statusCode !== 200) {
    throw new Error("Protected route access failed with auto-provisioned SSO session!");
  }

  console.log("\n=== STEP 4: VERIFY LOG AKTIVITAS FOR SSO LOGINS ===");
  const logRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/log-aktivitas?entitas=User&limit=10",
    method: "GET",
    headers: { Cookie: adminSessionCookie },
  });
  const logs = JSON.parse(logRes.body).data;
  console.log("-> Recent User/Login Activity Logs:");
  logs.slice(0, 5).forEach((l) => {
    console.log(`   [${l.aksi}] ${l.deskripsi}`);
  });

  const ssoLogFound = logs.some((l) => l.deskripsi.includes("SSO Kemnaker"));
  console.log(`-> SSO Kemnaker Login Log Recorded: ${ssoLogFound}`);
  if (!ssoLogFound) {
    throw new Error("Expected SSO login log entry not found in LogAktivitas!");
  }

  console.log("\n=== ALL SSO INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

main().catch((e) => {
  console.error("SSO Test Failed:", e);
  process.exit(1);
});
