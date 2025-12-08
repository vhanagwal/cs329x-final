import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GenUI Engine | Generative Interfaces for AI Collaboration",
  description: "AI-powered workspaces dynamically generated and personalized to your cognitive style. Based on NASA-TLX, Nielsen's Heuristics, and Cognitive Load Theory.",
  keywords: ["Generative UI", "LLM", "Human-AI Interaction", "Cognitive Load", "Personalization", "GPT-4"],
  authors: [{ name: "CS 329X Project" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased h-full`}
      >
        {children}
      </body>
    </html>
  );
}
