import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PwaInstall from "../components/PwaInstall";
import { ThemeProvider } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MConnect",
  description: "Real-time communication app",
  manifest: "/manifest.webmanifest",
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PwaInstall />
        </ThemeProvider>
      </body>
    </html>
  );
}
