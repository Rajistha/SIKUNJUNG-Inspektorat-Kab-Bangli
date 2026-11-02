import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIKUNJUNG - Buku Tamu Digital Inspektorat Kabupaten Bangli",
  description:
    "Sistem Informasi Kunjungan dan Buku Tamu Digital Inspektorat Daerah Pemerintah Kabupaten Bangli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1F2547",
              color: "#FFFFFF",
              borderRadius: "12px",
              fontSize: "14px",
              boxShadow: "0 8px 30px rgba(79, 106, 232, 0.15)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
