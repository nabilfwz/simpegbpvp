import { prisma } from "../lib/prisma.js";
import { generateSsoToken } from "../lib/sso.js";

async function testHttp() {
  console.log("=================================================================");
  console.log("HTTP ENDPOINTS & SSO ROUTING TEST");
  console.log("=================================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Test /sso/kemnaker page
  const resSsoPage = await fetch(`${baseUrl}/sso/kemnaker`);
  console.log(`GET /sso/kemnaker -> Status: ${resSsoPage.status}`);
  if (resSsoPage.status !== 200) {
    console.error("GET /sso/kemnaker failed!");
    process.exit(1);
  }

  // 2. Test /api/sso/accounts
  const resAccounts = await fetch(`${baseUrl}/api/sso/accounts`);
  const dataAccounts = await resAccounts.json();
  console.log(`GET /api/sso/accounts -> Status: ${resAccounts.status}, ASN counts: ${dataAccounts.pegawais?.length}`);
  if (resAccounts.status !== 200 || !dataAccounts.pegawais) {
    console.error("GET /api/sso/accounts failed!");
    process.exit(1);
  }

  // 3. Test /api/sso/verify with invalid token
  const resVerifyInvalid = await fetch(`${baseUrl}/api/sso/verify?token=invalid-dummy-token`);
  const dataVerifyInvalid = await resVerifyInvalid.json();
  console.log(`GET /api/sso/verify?token=invalid -> Status: ${resVerifyInvalid.status} (Expected 401), Valid: ${dataVerifyInvalid.valid}`);
  if (resVerifyInvalid.status !== 401 || dataVerifyInvalid.valid !== false) {
    console.error("Invalid token was not rejected with 401!");
    process.exit(1);
  }

  // 4. Test /api/sso/verify with real generated token
  const activePegawai = await prisma.pegawai.findFirst({
    where: { aktif: true },
    include: { subUnitKerja: true, unitKerja: true },
  });
  const user = await prisma.user.findFirst({ where: { aktif: true } });
  const realToken = generateSsoToken(user, activePegawai);

  const resVerifyValid = await fetch(`${baseUrl}/api/sso/verify?token=${encodeURIComponent(realToken)}`);
  const dataVerifyValid = await resVerifyValid.json();
  console.log(`GET /api/sso/verify (Valid Token) -> Status: ${resVerifyValid.status}, Valid: ${dataVerifyValid.valid}, NIP: ${dataVerifyValid.data?.nip}`);
  if (resVerifyValid.status !== 200 || !dataVerifyValid.valid) {
    console.error("Valid token was not accepted!");
    process.exit(1);
  }

  // 5. Test satellite demo page with token
  const resDemoApp = await fetch(`${baseUrl}/sso/demo-app?app=skillhub&sso_token=${encodeURIComponent(realToken)}`);
  console.log(`GET /sso/demo-app?app=skillhub&sso_token=... -> Status: ${resDemoApp.status}`);
  if (resDemoApp.status !== 200) {
    console.error("Satellite app page failed to render!");
    process.exit(1);
  }

  console.log("\n=================================================================");
  console.log("ALL HTTP ENDPOINTS TESTED SUCCESSFULLY!");
  console.log("=================================================================");
}

testHttp();
