import type { Metadata } from "next";
import "./globals.css";
import { SiteLoader } from "@/components/ui/SiteLoader";

export const metadata: Metadata = {
  title: "GEO AI Academy",
  description:
    "ონლაინ კურსების პლატფორმა ქართული ბაზრისთვის. ისწავლე AI ტექნოლოგიები ქართულად.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  if (!sessionStorage.getItem("geo-ai-loaded")) {
                    document.documentElement.classList.add("site-loader-pending");
                  }
                } catch (error) {
                  document.documentElement.classList.add("site-loader-pending");
                }
              })();
            `,
          }}
        />
        {/* Preload critical above-the-fold fonts to prevent FOIT */}
        <link
          rel="preload"
          href="/fonts/MontserratAlternates-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/margo-32328915633.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SiteLoader />
        <div id="site-content">{children}</div>
      </body>
    </html>
  );
}
