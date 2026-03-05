import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A4 Image Composer",
  description: "Compose images on an A4 page and export PNG/PDF"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
