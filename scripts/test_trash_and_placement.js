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
  console.log("=== STEP 1: AUTHENTICATION ===");
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
  console.log("-> Authenticated as admin successfully.");

  console.log("\n=== STEP 2: MASTER DATA VERIFICATION (DIRJEN, SUB_UNIT_KERJA, ESELON) ===");
  const dirjenRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/master-data?kategori=DIRJEN",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const dirjenData = JSON.parse(dirjenRes.body);
  console.log(`-> Loaded ${dirjenData.length} Dirjen items. First: ${dirjenData[0]?.label}`);

  const subUnitRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/master-data?kategori=SUB_UNIT_KERJA",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const subUnitData = JSON.parse(subUnitRes.body);
  const subbagianUmum = subUnitData.find(u => u.label.includes("Subbagian Umum"));
  console.log(`-> Loaded ${subUnitData.length} Sub Unit items. Subbagian Umum found:`, subbagianUmum?.label);
  if (!subbagianUmum) throw new Error("Subbagian Umum master data not found!");

  const eselonRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/master-data?kategori=ESELON",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const eselonData = JSON.parse(eselonRes.body);
  console.log(`-> Loaded ${eselonData.length} Eselon items. Sample:`, eselonData.slice(0, 3).map(e => e.label));

  // Get common master data required for Pegawai
  const jkRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=JENIS_KELAMIN", method: "GET", headers: { Cookie: sessionCookie } });
  const agamaRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=AGAMA", method: "GET", headers: { Cookie: sessionCookie } });
  const statusKRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=STATUS_PERKAWINAN", method: "GET", headers: { Cookie: sessionCookie } });
  const pendRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=PENDIDIKAN", method: "GET", headers: { Cookie: sessionCookie } });
  const unitKerjaRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=UNIT_KERJA", method: "GET", headers: { Cookie: sessionCookie } });
  const statusPRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/master-data?kategori=STATUS_PEGAWAI", method: "GET", headers: { Cookie: sessionCookie } });

  const jkId = JSON.parse(jkRes.body)[0].id;
  const agamaId = JSON.parse(agamaRes.body)[0].id;
  const statusKId = JSON.parse(statusKRes.body)[0].id;
  const pendId = JSON.parse(pendRes.body)[0].id;
  const unitKerjaId = JSON.parse(unitKerjaRes.body)[0].id;
  const statusPId = JSON.parse(statusPRes.body)[0].id;
  const dirjenId = dirjenData[0].id;
  const subUnitKerjaId = subbagianUmum.id;
  const eselonId = eselonData[0].id;

  console.log("\n=== STEP 3: CREATE PEGAWAI WITH DETAILED PLACEMENT ===");
  const testNip = "199505052024011099";

  // Pre-clean if exists from previous run
  const existingCheck = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?cari=" + testNip + "&trash=true",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const existingData = JSON.parse(existingCheck.body);
  if (existingData.data && existingData.data.length > 0) {
    for (const p of existingData.data) {
      await request({
        hostname: "127.0.0.1",
        port: 3000,
        path: `/api/pegawai/${p.id}?permanent=true`,
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      });
    }
  }
  const existingActive = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?cari=" + testNip,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const existingActiveData = JSON.parse(existingActive.body);
  if (existingActiveData.data && existingActiveData.data.length > 0) {
    for (const p of existingActiveData.data) {
      await request({
        hostname: "127.0.0.1",
        port: 3000,
        path: `/api/pegawai/${p.id}?permanent=true`,
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      });
    }
  }

  const createPayload = JSON.stringify({
    nip: testNip,
    nama: "Fajar Pratama (Test Subbagian Umum)",
    jenisKelaminId: jkId,
    tempatLahir: "Banda Aceh",
    tanggalLahir: "1995-05-05",
    agamaId: agamaId,
    statusPerkawinanId: statusKId,
    alamat: "Jl. Teuku Nyak Arief No. 12, Syiah Kuala",
    noHp: "081234567899",
    email: "fajar.test@bpvp.local",
    pendidikanTerakhirId: pendId,
    dirjenId: dirjenId,
    unitKerjaId: unitKerjaId,
    subUnitKerjaId: subUnitKerjaId,
    eselonId: eselonId,
    statusPegawaiId: statusPId,
  });

  const createRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(createPayload),
      Cookie: sessionCookie,
    },
  }, createPayload);

  console.log(`-> Create Pegawai HTTP status: ${createRes.statusCode}`);
  const createdJson = JSON.parse(createRes.body);
  if (createRes.statusCode !== 201) {
    console.error("Create failed:", createdJson);
    throw new Error("Failed to create pegawai");
  }
  const pegawaiId = createdJson.id;
  console.log(`-> Pegawai created with ID: ${pegawaiId}`);
  console.log(`-> Penempatan: Dirjen=${createdJson.dirjen?.label}, UnitKerja=${createdJson.unitKerja?.label}, SubUnit=${createdJson.subUnitKerja?.label}, Eselon=${createdJson.eselon?.label}`);

  console.log("\n=== STEP 4: CHECK ACTIVE LIST & COUNTS ===");
  const activeListRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?cari=" + testNip,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const activeListJson = JSON.parse(activeListRes.body);
  console.log(`-> Active list found: ${activeListJson.data.length} pegawai. Total active count: ${activeListJson.counts.active}, Trash count: ${activeListJson.counts.trash}`);
  if (activeListJson.data.length === 0) throw new Error("Created pegawai not found in active list!");

  console.log("\n=== STEP 5: SOFT DELETE PEGAWAI TO TONG SAMPAH ===");
  const softDeleteRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: `/api/pegawai/${pegawaiId}`,
    method: "DELETE",
    headers: { Cookie: sessionCookie },
  });
  console.log(`-> Soft delete status: ${softDeleteRes.statusCode}`);
  if (softDeleteRes.statusCode !== 200) throw new Error("Failed to soft delete pegawai");

  // Check active list again (should be 0)
  const activeAfterDeleteRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?cari=" + testNip,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const activeAfterDeleteJson = JSON.parse(activeAfterDeleteRes.body);
  console.log(`-> In active list after soft-delete: ${activeAfterDeleteJson.data.length} (Expected: 0)`);
  if (activeAfterDeleteJson.data.length !== 0) throw new Error("Pegawai still in active list after soft delete!");

  // Check trash list (should be 1)
  const trashListRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?trash=true&cari=" + testNip,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const trashListJson = JSON.parse(trashListRes.body);
  console.log(`-> In Tong Sampah list: ${trashListJson.data.length} (Expected: 1). Trash count badge: ${trashListJson.counts.trash}`);
  if (trashListJson.data.length !== 1) throw new Error("Pegawai not found in Tong Sampah!");

  console.log("\n=== STEP 6: RESTORE PEGAWAI FROM TONG SAMPAH ===");
  const restoreRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: `/api/pegawai/${pegawaiId}/restore`,
    method: "POST",
    headers: { Cookie: sessionCookie },
  });
  console.log(`-> Restore status: ${restoreRes.statusCode}`);
  if (restoreRes.statusCode !== 200) throw new Error("Failed to restore pegawai");

  // Check active list again (should be 1)
  const activeAfterRestoreRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/pegawai?cari=" + testNip,
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const activeAfterRestoreJson = JSON.parse(activeAfterRestoreRes.body);
  console.log(`-> In active list after restore: ${activeAfterRestoreJson.data.length} (Expected: 1)`);
  if (activeAfterRestoreJson.data.length !== 1) throw new Error("Pegawai not restored to active list!");

  console.log("\n=== STEP 7: SOFT DELETE AGAIN THEN PERMANENT DELETE (ADMIN ONLY) ===");
  // Put back in trash first
  await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: `/api/pegawai/${pegawaiId}`,
    method: "DELETE",
    headers: { Cookie: sessionCookie },
  });

  // Now permanent delete
  const permDeleteRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: `/api/pegawai/${pegawaiId}?permanent=true`,
    method: "DELETE",
    headers: { Cookie: sessionCookie },
  });
  console.log(`-> Permanent delete status: ${permDeleteRes.statusCode}`);
  if (permDeleteRes.statusCode !== 200) throw new Error("Permanent delete failed");

  // Check active and trash lists (should both be 0)
  const activeFinalRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/pegawai?cari=" + testNip, method: "GET", headers: { Cookie: sessionCookie } });
  const trashFinalRes = await request({ hostname: "127.0.0.1", port: 3000, path: "/api/pegawai?trash=true&cari=" + testNip, method: "GET", headers: { Cookie: sessionCookie } });
  console.log(`-> Final check: active=${JSON.parse(activeFinalRes.body).data.length}, trash=${JSON.parse(trashFinalRes.body).data.length} (Both must be 0)`);
  if (JSON.parse(activeFinalRes.body).data.length !== 0 || JSON.parse(trashFinalRes.body).data.length !== 0) {
    throw new Error("Pegawai still exists after permanent delete!");
  }

  console.log("\n=== STEP 8: VERIFY LOG AKTIVITAS ===");
  const logRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/log-aktivitas?entitas=Pegawai&limit=10",
    method: "GET",
    headers: { Cookie: sessionCookie },
  });
  const logs = JSON.parse(logRes.body).data;
  console.log("-> Recent Pegawai activity logs:");
  logs.slice(0, 5).forEach((l) => {
    console.log(`   [${l.aksi}] ${l.deskripsi} (${l.user?.nama})`);
  });

  const hasDeletePermanen = logs.some((l) => l.aksi === "DELETE_PERMANEN");
  const hasRestore = logs.some((l) => l.aksi === "RESTORE");
  const hasSoftDelete = logs.some((l) => l.aksi === "DELETE");
  const hasCreate = logs.some((l) => l.aksi === "CREATE");

  console.log(`-> Logs check: CREATE=${hasCreate}, DELETE(soft)=${hasSoftDelete}, RESTORE=${hasRestore}, DELETE_PERMANEN=${hasDeletePermanen}`);
  if (!hasRestore || !hasDeletePermanen) {
    throw new Error("Missing expected log entries for RESTORE or DELETE_PERMANEN!");
  }

  console.log("\n=== ALL BACKEND & WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
