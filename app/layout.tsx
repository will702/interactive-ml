import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import PageTransition from "@/components/layout/PageTransition";

const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Interactive ML & CV",
  description: "Machine Learning and Computer Vision interactive study site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${sourceSerif.variable}`}
    >
      <body className="flex h-screen overflow-hidden bg-[#FDFCFB]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="px-6 md:px-12 py-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          <BottomNav />
        </body>
    </html>
  );
}
