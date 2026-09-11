import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function runStandaloneSsoTests() {
  console.log("=================================================================");
  console.log("TEST SUITE: STANDALONE CENTRAL SSO (PORT 3001) & SIMPEG (PORT 3000)");
  console.log("=================================================================\n");

  const ssoBase = "http://localhost:3001";
  const simpegBase = "http://localhost:3000";
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  try {
    // 1. Check Central SSO Portal is live on Port 3001
    console.log("--- TEST 1: Central SSO Portal Reachability (Port 3001) ---");
    const resPortal = await fetch(`${ssoBase}/`);
    assert(resPortal.status === 200, "Central SSO Portal berjalan di port 3001", `HTTP ${resPortal.status}`);

    // 2. Check Accounts API
    console.log("\n--- TEST 2: Central SSO Accounts API ---");
    const resAccounts = await fetch(`${ssoBase}/api/accounts`);
    const dataAccounts = await resAccounts.json();
    assert(
      resAccounts.status === 200 && Array.isArray(dataAccounts.pegawais) && dataAccounts.pegawais.length > 0,
      "API Akun ASN aktif di SSO Server",
      `${dataAccounts.pegawais?.length} pegawai aktif terhubung`
    );

    // 3. Test Outsider Login Rejection (No data in Pegawai)
    console.log("\n--- TEST 3: Penolakan Orang Luar (Unregistered Outsider) ---");
    const resOutsider = await fetch(`${ssoBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "bukan.pegawai@gmail.com" }),
    });
    const dataOutsider = await resOutsider.json();
    assert(
      resOutsider.status === 401 && !dataOutsider.success && dataOutsider.error.includes("TIDAK TERDAFTAR"),
      "Orang luar tanpa data pegawai otomatis ditolak",
      `Status: ${resOutsider.status}, Pesan: ${dataOutsider.error}`
    );

    // 4. Test Inactive Pegawai Login Rejection (In Trash)
    console.log("\n--- TEST 4: Penolakan Pegawai Nonaktif (Tong Sampah) ---");
    const inactivePegawai = await prisma.pegawai.findFirst({ where: { aktif: false } });
    if (inactivePegawai) {
      const resInactive = await fetch(`${ssoBase}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inactivePegawai.nip }),
      });
      const dataInactive = await resInactive.json();
      assert(
        resInactive.status === 401 && !dataInactive.success && dataInactive.error.includes("NONAKTIF"),
        "Pegawai di tong sampah otomatis ditolak oleh Central SSO",
        `Pegawai: ${inactivePegawai.nama}, Pesan: ${dataInactive.error}`
      );
    } else {
      console.log("⚠️ Tidak ada pegawai nonaktif di database untuk diuji.");
    }

    // 5. Test Active Pegawai Login & Token Generation
    console.log("\n--- TEST 5: Autentikasi Pegawai Resmi & Penerbitan Token SSO ---");
    const activePegawai = await prisma.pegawai.findFirst({
      where: { aktif: true },
      include: { subUnitKerja: true, unitKerja: true },
    });

    const resLogin = await fetch(`${ssoBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: activePegawai.nip,
        callbackUrl: "http://localhost:3000/api/auth/sso/callback",
      }),
    });
    const dataLogin = await resLogin.json();
    assert(
      resLogin.status === 200 && dataLogin.success && typeof dataLogin.token === "string" && dataLogin.redirectUrl.includes("sso_token="),
      "Login berhasil & token SSO diterbitkan",
      `NIP: ${dataLogin.user?.nip}, Redirect: ${dataLogin.redirectUrl.slice(0, 60)}...`
    );

    const ssoToken = dataLogin.token;

    // 6. Test Token Verification API from Client App
    console.log("\n--- TEST 6: Verifikasi Token SSO via API /api/verify ---");
    const resVerify = await fetch(`${ssoBase}/api/verify?token=${encodeURIComponent(ssoToken)}`);
    const dataVerify = await resVerify.json();
    assert(
      resVerify.status === 200 && dataVerify.valid === true && dataVerify.data?.nip === activePegawai.nip,
      "Endpoint verifikasi token SSO mengonfirmasi identitas ASN",
      `Nama: ${dataVerify.data?.nama}, Unit: ${dataVerify.data?.subUnitKerja}`
    );

    // 7. Test Satellite Demo App in SSO Server
    console.log("\n--- TEST 7: Akses Aplikasi Satelit Ekosistem dengan Token SSO ---");
    const resSatellite = await fetch(`${ssoBase}/demo/skillhub?sso_token=${encodeURIComponent(ssoToken)}`);
    assert(
      resSatellite.status === 200,
      "Aplikasi satelit Skillhub BPVP dapat diakses dengan token SSO",
      `HTTP ${resSatellite.status}`
    );

    // 8. Test SIMPEG Client Pages (Port 3000)
    console.log("\n--- TEST 8: SIMPEG Client Pages & SSO Callback ---");
    const resSimpegLogin = await fetch(`${simpegBase}/login`);
    const htmlLogin = await resSimpegLogin.text();
    assert(
      resSimpegLogin.status === 200 && htmlLogin.includes("3001"),
      "Halaman login SIMPEG mengarahkan ke Central SSO Server (Port 3001)"
    );

    const resSimpegCallback = await fetch(`${simpegBase}/auth/sso-callback?sso_token=${encodeURIComponent(ssoToken)}`);
    assert(
      resSimpegCallback.status === 200,
      "Halaman callback SSO SIMPEG merender dengan sukses",
      `HTTP ${resSimpegCallback.status}`
    );

    console.log("\n=================================================================");
    console.log(`HASIL AKHIR: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Fatal error during tests:", err);
    process.exit(1);
  }
}

runStandaloneSsoTests();
