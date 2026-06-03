import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { QueryClientProvider } from "@/components/providers/query-provider"

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ISPLedger - WiFi Billing & ISP Management",
  description: "Professional WiFi billing and ISP management system. Manage clients, packages, routers, and payments with ease.",
  keywords: ["ISP", "WiFi", "Billing", "Management", "MikroTik", "Hotspot"],
  icons: {
    icon: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryClientProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="dark"
              toastOptions={{
                style: {
                  background: '#111b2e',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                },
              }}
            />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
