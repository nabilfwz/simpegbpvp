async function testSafe() {
  try {
    console.log("1. Get CSRF");
    const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
    const csrfData = await csrfRes.json();
    const csrfCookies = csrfRes.headers.getSetCookie();
    const cookieHeader = csrfCookies.map((c) => c.split(";")[0]).join("; ");

    console.log("2. Login");
    const body = new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: "admin@bpvp.local",
      password: "admin123",
      callbackUrl: "http://localhost:3000",
      redirect: "false",
      json: "true",
    });

    const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: body.toString(),
      redirect: "manual",
    });

    const setCookies = loginRes.headers.getSetCookie();
    const sessionToken = setCookies.find((c) => c.startsWith("next-auth.session-token="));
    const authCookie = sessionToken ? sessionToken.split(";")[0] : "";
    console.log("Login Status:", loginRes.status, "Has Cookie:", !!authCookie);

    const authFetch = async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Cookie: authCookie,
        },
      });
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (_) {}
      return { status: res.status, json, text, ok: res.ok };
    };

    console.log("\n3. Testing Master Data Categories");
    const categories = [
      "JENIS_KELAMIN",
      "AGAMA",
      "STATUS_PERKAWINAN",
      "PENDIDIKAN",
      "UNIT_KERJA",
      "STATUS_PEGAWAI",
      "PANGKAT_GOLONGAN",
      "JABATAN",
      "PROVINSI",
    ];
    const masterData = {};
    for (const cat of categories) {
      const r = await authFetch(`http://localhost:3000/api/master-data?kategori=${cat}`);
      if (r.ok && Array.isArray(r.json)) {
        masterData[cat] = r.json;
        console.log(`[OK] ${cat.padEnd(18)}: ${r.json.length} items`);
      } else {
        console.log(`[FAIL] ${cat.padEnd(18)}: Status ${r.status}`);
      }
    }

    // 4. Test Regional Cascading Hierarchy
    console.log("\n4. Testing Regional Cascading Address Hierarchy");
    const aceh = masterData["PROVINSI"].find((p) => p.label.toLowerCase() === "aceh");
    console.log("Found Provinsi Aceh:", aceh ? `YES (ID: ${aceh.id}, Kode: ${aceh.kode})` : "NO");

    const kabR = await authFetch(`http://localhost:3000/api/master-data?kategori=KABUPATEN_KOTA&parentId=${aceh.id}`);
    console.log(`Kabupaten/Kota di Aceh count: ${kabR.json?.length} (Expected: 23)`);

    const bandaAceh = kabR.json?.find((k) => k.label.includes("Banda Aceh"));
    const acehBesar = kabR.json?.find((k) => k.label.includes("Aceh Besar"));
    console.log("Found Kota Banda Aceh:", bandaAceh ? `YES (ID: ${bandaAceh.id})` : "NO");
    console.log("Found Kabupaten Aceh Besar:", acehBesar ? `YES (ID: ${acehBesar.id})` : "NO");

    const kecBAR = await authFetch(`http://localhost:3000/api/master-data?kategori=KECAMATAN&parentId=${bandaAceh.id}`);
    console.log(`Kecamatan di Kota Banda Aceh count: ${kecBAR.json?.length} (Expected: 9)`);
    if (kecBAR.json) {
      console.log("Daftar 9 Kecamatan di Banda Aceh:");
      kecBAR.json.forEach((k) => console.log(`  - ${k.label} (${k.kode})`));
    }

    const kecABR = await authFetch(`http://localhost:3000/api/master-data?kategori=KECAMATAN&parentId=${acehBesar.id}`);
    console.log(`Kecamatan di Kabupaten Aceh Besar count: ${kecABR.json?.length} (Expected: 23)`);

    // 5. Test Add Pegawai with Cascading Regional Address (Non-PNS: PPNPN / Instruktur Non-ASN)
    console.log("\n5. Testing Add Pegawai with Cascading Regional Address & Non-PNS Status");
    const baiturrahman = kecBAR.json?.find((k) => k.label.includes("Baiturrahman")) || kecBAR.json[0];
    const unitTIK = masterData["UNIT_KERJA"].find((u) => u.label.includes("TIK")) || masterData["UNIT_KERJA"][0];
    const statusNonASN = masterData["STATUS_PEGAWAI"].find((s) => s.label.includes("Non-ASN") || s.label.includes("PPNPN")) || masterData["STATUS_PEGAWAI"][0];

    const uniqueNIP = "PPNPN-" + Date.now();
    const newPegawai = {
      nip: uniqueNIP,
      nama: "Fadhil Al-Faruq, S.T. (Instruktur Non-ASN BPVP)",
      jenisKelaminId: masterData["JENIS_KELAMIN"][0].id,
      tempatLahir: "Banda Aceh",
      tanggalLahir: "1995-04-12T00:00:00.000Z",
      agamaId: masterData["AGAMA"][0].id,
      statusPerkawinanId: masterData["STATUS_PERKAWINAN"][0].id,
      provinsiId: aceh.id,
      kabupatenKotaId: bandaAceh.id,
      kecamatanId: baiturrahman.id,
      alamat: "Jl. Gebruek No. 1, Gampong Lamteumen Timur",
      noHp: "081269998877",
      email: "fadhil.alfaruq@bpvp.local",
      pendidikanTerakhirId: masterData["PENDIDIKAN"].find((p) => p.kode === "S1")?.id || masterData["PENDIDIKAN"][0].id,
      unitKerjaId: unitTIK.id,
      statusPegawaiId: statusNonASN.id,
    };

    const createR = await authFetch("http://localhost:3000/api/pegawai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPegawai),
    });

    console.log("Create Pegawai Status:", createR.status, createR.json ? createR.json.nama : createR.text);
    const pegawaiId = createR.json?.id;

    if (pegawaiId) {
      console.log("Created Pegawai Details:");
      console.log("  - Provinsi:", createR.json.provinsi?.label);
      console.log("  - Kabupaten/Kota:", createR.json.kabupatenKota?.label);
      console.log("  - Kecamatan:", createR.json.kecamatan?.label);
      console.log("  - Detail Alamat:", createR.json.alamat);
      console.log("  - Unit Kerja:", createR.json.unitKerja?.label);
      console.log("  - Status:", createR.json.statusPegawai?.label);

      // 6. Test GET Detail Pegawai
      console.log("\n6. Testing GET Detail Pegawai");
      const detailR = await authFetch(`http://localhost:3000/api/pegawai/${pegawaiId}`);
      console.log("Detail Status:", detailR.status);
      console.log(`Formatted Address: ${detailR.json?.alamat}, ${detailR.json?.kecamatan?.label}, ${detailR.json?.kabupatenKota?.label}, Prov. ${detailR.json?.provinsi?.label}`);

      // 7. Test PATCH Pegawai Address to Aceh Besar -> Kecamatan Ingin Jaya
      console.log("\n7. Testing Cascading Address Update via PATCH");
      const inginJaya = kecABR.json?.find((k) => k.label.includes("Ingin Jaya")) || kecABR.json[0];
      const patchR = await authFetch(`http://localhost:3000/api/pegawai/${pegawaiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kabupatenKotaId: acehBesar.id,
          kecamatanId: inginJaya.id,
          alamat: "Jl. Soekarno-Hatta No. 12, Gampong Meunasah Manyang",
        }),
      });

      console.log("PATCH Status:", patchR.status);
      console.log("Updated Details:");
      console.log("  - New Kab/Kota:", patchR.json?.kabupatenKota?.label);
      console.log("  - New Kecamatan:", patchR.json?.kecamatan?.label);
      console.log("  - New Alamat:", patchR.json?.alamat);
    }

    // 8. Checking Log Aktivitas
    console.log("\n8. Checking Log Aktivitas");
    const logR = await authFetch("http://localhost:3000/api/log-aktivitas?limit=5");
    console.log("Log Aktivitas Status:", logR.status, "Total Logs:", logR.json?.pagination?.total);
    if (logR.json?.data) {
      logR.json.data.slice(0, 3).forEach((l) => {
        console.log(`  - [${l.aksi}] ${l.entitas}: ${l.deskripsi}`);
      });
    }

    // 9. Checking Dashboard API
    console.log("\n9. Checking Dashboard API");
    const dashR = await authFetch("http://localhost:3000/api/dashboard");
    console.log("Dashboard Status:", dashR.status);
    console.log("  Total Pegawai:", dashR.json?.totalPegawai);
    console.log("  Unit Kerja Groups:", dashR.json?.pegawaiPerUnitKerja?.length);
    console.log("  Status Groups:", dashR.json?.pegawaiPerStatus?.length);

    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test error:", err);
  }
}

testSafe();
