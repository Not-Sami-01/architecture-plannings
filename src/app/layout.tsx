import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Serif_Display, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";

import { Providers } from "@/components/common/providers";
import { THEME_INIT_SCRIPT } from "@/components/common/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP } from "@/config/constants";
import { publicConfig } from "@/config/public-config";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicConfig.appUrl),
  title: {
    default: APP.name,
    template: `%s | ${APP.name}`,
  },
  description: APP.description,
};

/** Brand typography (DESIGN.md): DM Serif Display for ideas, Inter for everything else. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // next-themes + the palette script mutate <html> classes pre-hydration.
      suppressHydrationWarning
      className={`${inter.variable} ${dmSerifDisplay.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <Providers>
            {children}
            <Toaster richColors position="top-center" />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
