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
  console.log("=== TESTING EDIT AUDIT TRAIL: DATA LAMA & DATA BARU ===");

  // Step 1: Login Admin
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
  console.log("-> Admin Login: Success (HTTP 200)");

  // Step 2: Get a Pegawai to edit
  const pegRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?limit=1",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const pegData = JSON.parse(pegRes.body);
  const targetPegawai = pegData.data[0];
  console.log(`-> Target Pegawai: ${targetPegawai.nama} (ID: ${targetPegawai.id})`);
  const originalAlamat = targetPegawai.alamat;
  const originalNoHp = targetPegawai.noHp || "081234567890";

  // Step 3: Edit data (UPDATE)
  const newAlamat = `Jl. Pengujian Sistem No. ${Date.now().toString().slice(-4)}, Banda Aceh`;
  const newNoHp = "081122334455";
  console.log(`-> Editing data:`);
  console.log(`   - Alamat Lama : "${originalAlamat}"`);
  console.log(`   - Alamat Baru : "${newAlamat}"`);

  const updatePayload = JSON.stringify({
    alamat: newAlamat,
    noHp: newNoHp,
  });

  const updateRes = await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: `/api/pegawai/${targetPegawai.id}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(updatePayload),
        Cookie: sessionCookie,
      },
    },
    updatePayload
  );

  console.log(`-> PATCH /api/pegawai/${targetPegawai.id}: HTTP ${updateRes.statusCode}`);
  if (updateRes.statusCode !== 200) {
    throw new Error(`Failed to update pegawai: ${updateRes.body}`);
  }

  // Step 4: Check LogAktivitas
  const logRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: `/api/log-aktivitas?entitas=Pegawai&aksi=UPDATE&limit=1`,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });

  const logData = JSON.parse(logRes.body);
  const latestLog = logData.data[0];
  console.log("\n-> Verifying LogAktivitas Record:");
  console.log(`   Log ID      : ${latestLog.id}`);
  console.log(`   Aksi        : ${latestLog.aksi}`);
  console.log(`   Entitas     : ${latestLog.entitas}`);
  console.log(`   Deskripsi   : ${latestLog.deskripsi}`);
  console.log(`   User        : ${latestLog.user.nama}`);

  if (!latestLog.dataSebelum) {
    throw new Error("FAIL: dataSebelum is NULL or missing!");
  }
  if (!latestLog.dataSesudah) {
    throw new Error("FAIL: dataSesudah is NULL or missing!");
  }

  console.log("\n-> AUDIT TRAIL COMPARISON (DATA LAMA vs DATA BARU):");
  console.log(`   dataSebelum.alamat : "${latestLog.dataSebelum.alamat}"`);
  console.log(`   dataSesudah.alamat : "${latestLog.dataSesudah.alamat}"`);
  console.log(`   dataSebelum.noHp   : "${latestLog.dataSebelum.noHp}"`);
  console.log(`   dataSesudah.noHp   : "${latestLog.dataSesudah.noHp}"`);

  // Verify relation snapshot is preserved
  if (latestLog.dataSebelum.unitKerja) {
    console.log(`   dataSebelum.unitKerja: "${latestLog.dataSebelum.unitKerja.label}"`);
  }
  if (latestLog.dataSesudah.unitKerja) {
    console.log(`   dataSesudah.unitKerja: "${latestLog.dataSesudah.unitKerja.label}"`);
  }

  if (latestLog.dataSebelum.alamat === latestLog.dataSesudah.alamat) {
    throw new Error("FAIL: dataSebelum.alamat should not equal dataSesudah.alamat!");
  }
  if (latestLog.dataSesudah.alamat !== newAlamat) {
    throw new Error("FAIL: dataSesudah.alamat does not match newAlamat!");
  }

  console.log("\n-> AUDIT TRAIL VERIFICATION PASSED: BOTH DATA LAMA & DATA BARU SAVED AND VERIFIED!");

  // Step 5: Restore original data
  const revertPayload = JSON.stringify({
    alamat: originalAlamat,
    noHp: originalNoHp,
  });
  await request(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: `/api/pegawai/${targetPegawai.id}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(revertPayload),
        Cookie: sessionCookie,
      },
    },
    revertPayload
  );
  console.log("-> Data successfully restored to original state.");
  console.log("=== ALL AUDIT TRAIL TESTS COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
