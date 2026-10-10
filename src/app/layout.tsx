import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // next-themes + the palette script mutate <html> classes pre-hydration.
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
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
