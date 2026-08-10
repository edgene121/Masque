import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import MemberstackInit from "@/components/memberstack/MemberstackInit";
import "./globals.css";

const displaySerif = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodySans = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Masqué Bridge Member Portal",
  description:
    "Exclusive member portal for Masqué Bridge — events, Dispatches, and membership.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <MemberstackInit />
        {children}
      </body>
    </html>
  );
}
