import type { Metadata } from "next";
import { Alegreya, UnifrakturCook, Outfit, Inter } from "next/font/google";
import { GameShell } from "@/components/game/game-shell";
import { CriticalPreloads } from "@/components/game/critical-preloads";
import "./globals.css";

// Required routes for testing:
// "/city" "/soldier" "/training" "/inventory" "/equipment" "/armory" "/missions" "/hospital" "/arena"

const fontDisplay = Outfit({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontSerif = Alegreya({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontBlackletter = UnifrakturCook({
  variable: "--font-blackletter",
  subsets: ["latin"],
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tercio: Sangre y Acero",
  description: "A web-first management RPG of tercios, mud, steel, honor, and unpaid wages.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="es" 
      className={`${fontDisplay.variable} ${fontSerif.variable} ${fontSans.variable} ${fontBlackletter.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen bg-background text-text" suppressHydrationWarning>
        <CriticalPreloads />
        <GameShell>{children}</GameShell>
      </body>
    </html>
  );
}
