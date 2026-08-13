import { AdminShellEffect } from "@/components/admin/AdminShellEffect";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminShellEffect />
      {children}
    </>
  );
}
