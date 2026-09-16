import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (STAFF_ROLES.includes(role)) {
    redirect("/admin/master-data");
  }

  redirect("/");
}
