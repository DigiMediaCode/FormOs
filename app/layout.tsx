import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormOS",
  description: "Standalone SaaS-style form builder foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
