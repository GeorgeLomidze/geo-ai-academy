import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO AI Academy — ისწავლე AI ტექნოლოგიები ქართულად",
  description:
    "ონლაინ კურსების პლატფორმა ქართული ბაზრისთვის. ისწავლე AI ტექნოლოგიები ქართულად.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
