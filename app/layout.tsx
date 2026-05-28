import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { AppBackground } from "@/components/layout/app-background";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} | Modern GST Billing`,
  description: "Premium GST billing and invoice SaaS built for modern Indian businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <AppBackground />
        <div className="relative min-h-screen">{children}</div>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
