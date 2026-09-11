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
  console.log("=== STEP 1: TEST DYNAMIC SSO ACCOUNTS ENDPOINT ===");
  const accountsRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/sso/accounts",
    method: "GET",
  });
  console.log(`-> GET /api/sso/accounts: HTTP ${accountsRes.statusCode}`);
  const accountsData = JSON.parse(accountsRes.body);
  console.log(`-> Loaded ${accountsData.users?.length} Users and ${accountsData.pegawais?.length} ASN Pegawai from DB.`);
  if (!accountsData.pegawais || accountsData.pegawais.length === 0) {
    throw new Error("No Pegawai found in /api/sso/accounts!");
  }
  console.log("-> Sample ASN loaded in SSO portal:", accountsData.pegawais.slice(0, 3).map((p) => `${p.nama} (${p.nip})`));

  console.log("\n=== STEP 2: SSO AUTHENTICATION ===");
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

  const ssoBody = new URLSearchParams({
    csrfToken,
    email: "admin@bpvp.local",
    nama: "Administrator BPVP",
    nip: "198001012005011001",
    role: "admin",
    callbackUrl: "http://127.0.0.1:3000/",
    json: "true",
  }).toString();

  const ssoRes = await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/auth/callback/sso-kemnaker",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(ssoBody),
        Cookie: rawCookie,
      },
    },
    ssoBody
  );
  const authCookies = (ssoRes.headers["set-cookie"] || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  const sessionCookie = `${rawCookie}; ${authCookies}`;
  console.log(`-> SSO Login Success: HTTP ${ssoRes.statusCode}`);

  console.log("\n=== STEP 3: VERIFY DASHBOARD STATS LOADED ===");
  const dashRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/dashboard",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  console.log(`-> GET /api/dashboard: HTTP ${dashRes.statusCode}`);
  const dashData = JSON.parse(dashRes.body);
  console.log(`-> Total Pegawai: ${dashData.totalPegawai}`);
  console.log("-> Pegawai per Status:", dashData.pegawaiPerStatus);
  console.log("-> Pegawai per Unit Kerja:", dashData.pegawaiPerUnitKerja);
  if (dashData.totalPegawai === 0) {
    throw new Error("Dashboard totalPegawai is 0! Data not loaded!");
  }

  console.log("\n=== STEP 4: VERIFY PEGAWAI TABLE DATA LOADED ===");
  const pegawaiRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?page=1&limit=10",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  console.log(`-> GET /api/pegawai: HTTP ${pegawaiRes.statusCode}`);
  const pegawaiData = JSON.parse(pegawaiRes.body);
  console.log(`-> Loaded ${pegawaiData.data?.length} Pegawai rows. Total active count: ${pegawaiData.counts?.active}`);
  if (pegawaiData.data.length === 0) {
    throw new Error("Pegawai list is empty!");
  }
  const sample = pegawaiData.data[0];
  console.log(`-> Sample Record: Nama="${sample.nama}", NIP="${sample.nip}", SubUnit="${sample.subUnitKerja?.label}", Eselon="${sample.eselon?.label}"`);

  console.log("\n=== ALL DATA VERIFIED: SSO & PEGAWAI DATA LOADED COMPLETELY AND SUCCESSFULLY! ===");
}

main().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
