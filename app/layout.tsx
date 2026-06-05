import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { ModeProvider } from "@/lib/mode";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Moonjar Stories",
  description: "Stories from your family, kept and continued.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#fdf6ec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ModeProvider>
          <AuthProvider>
            <TopNav />
            {children}
          </AuthProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
