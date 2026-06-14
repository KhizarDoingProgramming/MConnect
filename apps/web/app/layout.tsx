import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PwaInstall from "../components/PwaInstall";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MConnect",
  description: "Real-time communication app",
  manifest: "/manifest.webmanifest",
  themeColor: "#202c33",
  appleWebApp: {
    capable: true,
    title: "MConnect",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PwaInstall />
      </body>
    </html>
  );
}
