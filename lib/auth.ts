import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: any[] = [
  // 1. Standar Credentials (Email & Password)
  CredentialsProvider({
    id: "credentials",
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email dan password wajib diisi");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });

      if (!user) {
        throw new Error("Email atau password salah");
      }

      if (!user.aktif) {
        throw new Error("Akun tidak aktif. Hubungi administrator");
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Email atau password salah");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.nama,
        role: user.role,
      };
    },
  }),

  // 2. Layanan Single Sign-On (SSO) Kemnaker RI (SIAPkerja ID / Kemnaker Portal)
  CredentialsProvider({
    id: "sso-kemnaker",
    name: "SSO Kemnaker (SIAPkerja ID)",
    credentials: {
      email: { label: "Email SSO Kemnaker", type: "text" },
      nip: { label: "NIP", type: "text" },
      nama: { label: "Nama ASN", type: "text" },
      role: { label: "Role ASN", type: "text" },
      ssoToken: { label: "SSO Token", type: "text" },
    },
    async authorize(credentials) {
      const { validatePegawaiForSso, verifySsoToken } = await import("@/lib/sso");

      // A. Autentikasi via Cross-App SSO Token (Pindah Antar Aplikasi BPVP tanpa login ulang)
      if (credentials?.ssoToken) {
        const payload = await verifySsoToken(credentials.ssoToken);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user || !user.aktif) {
          throw new Error("Sesi SSO tidak valid atau akun pengguna dinonaktifkan.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
        };
      }

      // B. Autentikasi via Kredensial SSO Kemnaker (NIP / Email Kedinasan)
      const identifier = credentials?.email?.trim() || credentials?.nip?.trim();
      if (!identifier) {
        throw new Error("Email atau NIP wajib diisi untuk verifikasi SSO Kemnaker");
      }

      // Validasi ketat terhadap database Manajemen Pegawai BPVP
      // Orang luar dan pegawai nonaktif (tong sampah) otomatis ditolak dengan pesan jelas
      const { user } = await validatePegawaiForSso(identifier);

      return {
        id: user.id,
        email: user.email,
        name: user.nama,
        role: user.role,
      };
    },
  }),
];

// 3. Google Workspace SSO (Aktif jika GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET diisi)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (user && user.email) {
          const email = user.email.toLowerCase().trim();

          // Jika login melalui OAuth eksternal (Google), verifikasi ketat apakah terdaftar di Pegawai BPVP
          if (account?.provider === "google") {
            const pegawai = await prisma.pegawai.findFirst({
              where: {
                email: { equals: email, mode: "insensitive" },
              },
            });

            let dbUser = await prisma.user.findUnique({
              where: { email },
            });

            // Tolak orang luar yang emailnya tidak terdaftar di database Pegawai atau User
            if (!pegawai && !dbUser) {
              console.warn(`[SSO Rejection] Email Google "${email}" ditolak karena bukan pegawai resmi BPVP.`);
              return false;
            }

            // Tolak jika status pegawai nonaktif di database (tong sampah)
            if (pegawai && !pegawai.aktif) {
              console.warn(`[SSO Rejection] Pegawai "${pegawai.nama}" (${email}) ditolak karena status nonaktif.`);
              return false;
            }

            if (dbUser && !dbUser.aktif) {
              console.warn(`[SSO Rejection] User "${email}" ditolak karena akun nonaktif.`);
              return false;
            }

            if (!dbUser && pegawai) {
              // Provision user untuk pegawai yang valid
              const randomPassword = await bcrypt.hash(
                Math.random().toString(36).slice(-10) + Date.now().toString(),
                10
              );
              dbUser = await prisma.user.create({
                data: {
                  email,
                  nama: user.name || pegawai.nama,
                  password: randomPassword,
                  role: "operator",
                  aktif: true,
                },
              });
            }

            if (dbUser) {
              (user as any).id = dbUser.id;
              (user as any).role = dbUser.role;
            }
          }

          const providerName =
            account?.provider === "sso-kemnaker"
              ? "SSO Kemnaker (SIAPkerja ID)"
              : account?.provider === "google"
              ? "Google Workspace"
              : "Kredensial Manual";

          // Catat aktivitas login ke tabel LogAktivitas
          await prisma.logAktivitas.create({
            data: {
              userId: user.id,
              aksi: "LOGIN",
              entitas: "User",
              entitasId: user.id,
              deskripsi: `User ${email} berhasil login melalui ${providerName}`,
              ipAddress: "127.0.0.1",
            },
          });
        }
      } catch (error) {
        console.error("[signIn callback] Gagal mencatat log login:", error);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
