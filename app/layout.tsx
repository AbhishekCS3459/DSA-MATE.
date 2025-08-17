import { AuthProvider } from "@/components/auth/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import type React from "react"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'),
  title: {
    default: "CodeCraft - Master DSA & Coding Skills",
    template: "%s | CodeCraft"
  },
  description: "Advanced platform for mastering Data Structures, Algorithms, and coding skills. Track progress, take notes, and prepare for technical interviews with our comprehensive DSA tracker.",
  keywords: ["DSA", "algorithms", "data structures", "coding practice", "leetcode", "technical interview", "programming", "computer science", "coding skills", "algorithm practice", "coding platform", "DSA tracker", "interview preparation"],
  authors: [{ name: "CodeCraft Team" }],
  creator: "CodeCraft",
  publisher: "CodeCraft",
  generator: "Next.js",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "CodeCraft - Master DSA & Coding Skills",
    description: "Advanced platform for mastering Data Structures, Algorithms, and coding skills. Track progress, take notes, and prepare for technical interviews.",
    type: "website",
    locale: "en_US",
    siteName: "CodeCraft",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com',
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CodeCraft - DSA Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeCraft - Master DSA & Coding Skills",
    description: "Advanced platform for mastering Data Structures, Algorithms, and coding skills.",
    images: ["/og-image.png"],
    creator: "@codecraft",
    site: "@codecraft",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com',
  },
  category: "education",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "CodeCraft",
              "description": "Advanced platform for mastering Data Structures, Algorithms, and coding skills. Track progress, take notes, and prepare for technical interviews.",
              "url": "https://yourdomain.com",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "CodeCraft Team"
              },
              "publisher": {
                "@type": "Organization",
                "name": "CodeCraft"
              },
              "keywords": "DSA, algorithms, data structures, coding practice, leetcode, technical interview, programming, computer science, coding skills, algorithm practice"
            })
          }}
        />
      </head>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
