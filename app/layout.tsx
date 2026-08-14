import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SaveSuccessToastHost } from "@/components/common/SaveSuccessToastHost";
import { APP_LOCALE, SITE_DESCRIPTION, SITE_NAME } from "@/constants/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
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
