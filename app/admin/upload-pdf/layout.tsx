import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { getAdminAccessState } from "@/lib/admin/session";
import { ROUTES } from "@/constants/routes";

export default async function UploadPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, reason, isAdmin } = await getAdminAccessState();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent("/admin/upload-pdf")}`);
  }

  if (!isAdmin) {
    return <AdminAccessDenied reason={reason} user={user} />;
  }

  return children;
}
