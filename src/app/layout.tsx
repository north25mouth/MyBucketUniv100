import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "大学時代でやりたいこと100",
  description: "大学時代にやりたいこと100を、スワイプで振り返るパーソナル・アルバム。",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.className} bg-slate-50 text-slate-800 antialiased`}
      >
        <AuthProvider>
          <div className="flex-1 w-full max-w-md mx-auto bg-white shadow-xl min-h-screen relative flex flex-col border-x border-slate-100">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
