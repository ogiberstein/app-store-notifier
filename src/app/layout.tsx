import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Store Notifier",
  description: "Get daily email updates for your favorite app store rankings.",
  openGraph: {
    title: "App Store Notifier",
    description: "Get daily email updates for your favorite app store rankings.",
    url: "https://www.appstoreposition.com",
    siteName: "App Store Notifier",
    images: [
      {
        url: "https://www.appstoreposition.com/globe.svg",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
} 