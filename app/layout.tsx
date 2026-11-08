import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Progress Harian",
  description: "Pantau progress project kamu setiap hari",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${font.className} bg-[#F2F5F7] text-[#18222D] antialiased`}>
        {children}
      </body>
    </html>
  );
}
