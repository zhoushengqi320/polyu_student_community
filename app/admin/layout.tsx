import { AdminShellEffect } from "@/components/admin/AdminShellEffect";
import { AdminUserBar } from "@/components/admin/AdminUserBar";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/utils/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <>
      <AdminShellEffect />
      {user && can(user, "admin:access") ? <AdminUserBar user={user} /> : null}
      {children}
    </>
  );
}
