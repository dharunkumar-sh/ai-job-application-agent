import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f0f12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jobbuddy-ai.vercel.app"),
  title: {
    default: "JobBuddy AI — Smart AI Job Search Assistant & Resume Workspace",
    template: "%s | JobBuddy AI",
  },
  description:
    "JobBuddy AI is your personal AI career assistant. Automate job applications, generate ATS-tailored resumes, and track interview pipelines in real time.",
  keywords: [
    "JobBuddy AI",
    "Smart Career Assistant",
    "ATS Resume Tailoring",
    "Job Application Tracker",
    "AI Job Search Buddy",
    "Cover Letter Generator",
    "Interview Pipeline Analytics",
  ],
  authors: [{ name: "JobBuddy AI Team" }],
  creator: "JobBuddy AI",
  publisher: "JobBuddy AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jobbuddy-ai.vercel.app",
    siteName: "JobBuddy AI",
    title: "JobBuddy AI — Smart AI Job Search Assistant & Resume Workspace",
    description:
      "Automate your job search with JobBuddy AI. Generate tailored resumes, track application pipelines, and calculate ATS keyword match scores.",
    images: [
      {
        url: "/auth-hero.jpg",
        width: 1200,
        height: 630,
        alt: "JobBuddy AI Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobBuddy AI — Smart AI Job Search Assistant & Resume Workspace",
    description:
      "Automate your job search with JobBuddy AI. Generate tailored resumes, track application pipelines, and land your next role faster.",
    images: ["/auth-hero.jpg"],
    creator: "@JobBuddyAI",
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "JobBuddy AI",
    url: "https://jobbuddy-ai.vercel.app",
    description:
      "JobBuddy AI is your personal AI career assistant. Automate job applications, generate ATS-tailored resumes, and track interview pipelines in real time.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0f0f12] text-zinc-100 selection:bg-[#57cc99] selection:text-[#0f0f12]">
        {children}
      </body>
    </html>
  );
}
