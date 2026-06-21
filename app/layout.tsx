import type { Metadata } from "next";
import "./globals.css";
import { Poppins, Geist } from "next/font/google"
import { cn } from "@/lib/utils";
import {Toaster} from "@/components/ui/sonner";
import { Providers } from "@/components/Providers"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "SmartStore",
  description: "SmartStore - The only storage solution you need.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-poppins", "antialiased", poppins.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
