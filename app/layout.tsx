import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { ModeProvider } from "@/lib/mode";

export const metadata: Metadata = {
  title: "StoryKeeper",
  description: "Stories from your parent, kept and continued.",
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
          <TopNav />
          {children}
        </ModeProvider>
      </body>
    </html>
  );
}
