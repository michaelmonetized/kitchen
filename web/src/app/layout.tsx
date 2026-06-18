import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kitchen.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Kitchen — Cloud-native project store",
    template: "%s — Kitchen",
  },
  description:
    "Your projects live in the cloud. Your editor sees them on disk. Live sync, human merge, editor-agnostic pair programming.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Kitchen — Cloud-native project store",
    description:
      "Four layers, three modes. Live sync, human merge, any editor. Kitchen is a codename.",
    url: siteUrl,
    siteName: "Kitchen",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kitchen" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kitchen — Cloud-native project store",
    description: "Live sync, human merge, editor-agnostic pair programming.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}