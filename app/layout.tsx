import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteProgressBar } from "@/components/common/RouteProgressBar";
import { SaveSuccessToastHost } from "@/components/common/SaveSuccessToastHost";
import { APP_LOCALE, SITE_DESCRIPTION } from "@/constants/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Polyuhub｜香港理工大学学生社区 | 课程资料与校园论坛",
    template: `%s | Polyuhub`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/brand/polyuhub-logo.jpg",
    apple: "/brand/polyuhub-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={APP_LOCALE}>
      <body className="min-h-screen antialiased">
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <SaveSuccessToastHost />
      </body>
    </html>
  );
}
