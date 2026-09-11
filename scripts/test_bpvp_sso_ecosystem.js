import { prisma } from "../lib/prisma.js";
import { validatePegawaiForSso, generateSsoToken, verifySsoToken, BPVP_ECOSYSTEM_APPS } from "../lib/sso.js";

async function runTests() {
  console.log("=================================================================");
  console.log("TEST SUITE: BPVP CENTRAL SSO & TOKENS ECOSYSTEM VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  try {
    // 1. Check Ecosystem Apps Definition
    assert(
      Array.isArray(BPVP_ECOSYSTEM_APPS) && BPVP_ECOSYSTEM_APPS.length >= 6,
      "Definisi Ekosistem Aplikasi BPVP",
      `${BPVP_ECOSYSTEM_APPS.length} aplikasi terdaftar (SIMPEG, Skillhub, Maganghub, LSP-P1, Keuangan, PTSP)`
    );

    // 2. Test: Outsider Email MUST BE REJECTED
    console.log("\n--- TEST 1: Penolakan Orang Luar (Unregistered Outsider) ---");
    let outsiderRejected = false;
    let outsiderError = "";
    try {
      await validatePegawaiForSso("hacker.luar@gmail.com");
    } catch (err) {
      outsiderRejected = true;
      outsiderError = err.message;
    }
    assert(
      outsiderRejected && outsiderError.includes("tidak terdaftar"),
      "Orang luar tanpa data pegawai otomatis ditolak",
      outsiderError
    );

    // 3. Test: Active Pegawai BPVP MUST BE ALLOWED
    console.log("\n--- TEST 2: Validasi Pegawai Resmi BPVP Aktif ---");
    const activePegawai = await prisma.pegawai.findFirst({
      where: { aktif: true },
      include: { subUnitKerja: true, unitKerja: true },
    });

    let authResult;
    if (!activePegawai) {
      console.error("Tidak ada pegawai aktif untuk diuji!");
    } else {
      console.log(`Pengujian dengan pegawai aktif: ${activePegawai.nama} (NIP: ${activePegawai.nip})`);
      authResult = await validatePegawaiForSso(activePegawai.nip);
      assert(
        authResult && authResult.user && authResult.pegawai.nip === activePegawai.nip,
        "Pegawai aktif berhasil divalidasi SSO",
        `User ID: ${authResult.user.id}, Role: ${authResult.user.role}`
      );
    }

    // 4. Test: Inactive Pegawai (Di Tong Sampah) MUST BE REJECTED
    console.log("\n--- TEST 3: Penolakan Pegawai Nonaktif (Tong Sampah) ---");
    // Find or create a temporary inactive pegawai
    let inactivePegawai = await prisma.pegawai.findFirst({
      where: { aktif: false },
    });

    let tempInactiveCreated = false;
    if (!inactivePegawai && activePegawai) {
      // Create a temporary inactive pegawai for test
      inactivePegawai = await prisma.pegawai.create({
        data: {
          nip: "199999999999999999",
          nama: "Pegawai Nonaktif Uji Coba",
          tempatLahir: "Banda Aceh",
          tanggalLahir: new Date("1990-01-01"),
          alamat: "Jl. Uji Coba",
          aktif: false, // Inactive / trash
          jenisKelaminId: activePegawai.jenisKelaminId,
          agamaId: activePegawai.agamaId,
          statusPerkawinanId: activePegawai.statusPerkawinanId,
          pendidikanTerakhirId: activePegawai.pendidikanTerakhirId,
          unitKerjaId: activePegawai.unitKerjaId,
          statusPegawaiId: activePegawai.statusPegawaiId,
        },
      });
      tempInactiveCreated = true;
    }

    let inactiveRejected = false;
    let inactiveError = "";
    try {
      await validatePegawaiForSso(inactivePegawai.nip);
    } catch (err) {
      inactiveRejected = true;
      inactiveError = err.message;
    }
    assert(
      inactiveRejected && (inactiveError.includes("nonaktif") || inactiveError.includes("tong sampah")),
      "Pegawai nonaktif / tong sampah otomatis ditolak",
      inactiveError
    );

    if (tempInactiveCreated && inactivePegawai) {
      await prisma.pegawai.delete({ where: { id: inactivePegawai.id } });
    }

    // 5. Test: Cross-App SSO Token Generation & Verification
    console.log("\n--- TEST 4: Pembuatan & Verifikasi Cross-App SSO Token (HMAC-SHA256) ---");
    const testUser = {
      id: authResult.user.id,
      nama: authResult.user.nama,
      email: authResult.user.email,
      role: authResult.user.role,
    };

    const ssoToken = generateSsoToken(testUser, activePegawai);
    assert(
      typeof ssoToken === "string" && ssoToken.includes("."),
      "Token SSO Cross-App berhasil dibuat",
      `Token preview: ${ssoToken.slice(0, 30)}...`
    );

    const verifiedPayload = await verifySsoToken(ssoToken);
    assert(
      verifiedPayload.nip === activePegawai.nip && verifiedPayload.nama === activePegawai.nama,
      "Token SSO berhasil diverifikasi dan integritas data terjaga",
      `NIP: ${verifiedPayload.nip}, Exp: ${new Date(verifiedPayload.exp * 1000).toLocaleTimeString()}`
    );

    // 6. Test: Tampered SSO Token MUST BE REJECTED
    console.log("\n--- TEST 5: Deteksi Manipulasi Token (Anti-Tampering) ---");
    const tamperedToken = ssoToken.slice(0, -5) + "abcde";
    let tamperedRejected = false;
    let tamperedError = "";
    try {
      await verifySsoToken(tamperedToken);
    } catch (err) {
      tamperedRejected = true;
      tamperedError = err.message;
    }
    assert(
      tamperedRejected && tamperedError.toLowerCase().includes("tanda tangan"),
      "Token yang dimanipulasi berhasil ditolak sistem",
      tamperedError
    );

    // 7. Test: Tong Sampah Pegawai Count in DB
    console.log("\n--- TEST 6: Pengecekan Data Tong Sampah Pegawai ---");
    const trashCount = await prisma.pegawai.count({ where: { aktif: false } });
    const activeCount = await prisma.pegawai.count({ where: { aktif: true } });
    console.log(`Jumlah Pegawai Aktif: ${activeCount}`);
    console.log(`Jumlah Pegawai di Tong Sampah: ${trashCount}`);
    assert(
      typeof trashCount === "number" && typeof activeCount === "number",
      "Kueri data pegawai aktif vs tong sampah berfungsi sempurna"
    );

    console.log("\n=================================================================");
    console.log(`HASIL AKHIR: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error during tests:", error);
    process.exit(1);
  }
}

runTests();
