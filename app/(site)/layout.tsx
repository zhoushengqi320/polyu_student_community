import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AccountStatusBanner } from "@/components/layout/AccountStatusBanner";
import { LastSeenHeartbeat } from "@/components/common/LastSeenHeartbeat";

/** 前台站点壳：导航与页脚仅包裹公开页面，不进入 /admin。 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <LastSeenHeartbeat />
      <Navbar />
      <AccountStatusBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
