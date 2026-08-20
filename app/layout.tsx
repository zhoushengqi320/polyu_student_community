import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteProgressBar } from "@/components/common/RouteProgressBar";
import { SaveSuccessToastHost } from "@/components/common/SaveSuccessToastHost";
import { APP_LOCALE, SITE_DESCRIPTION } from "@/constants/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PolyUHub｜香港理工大学学生社区 | 课程评价与校园指南",
    template: `%s | PolyUHub`,
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
        {children}
        <SaveSuccessToastHost />
      </body>
    </html>
  );
}
