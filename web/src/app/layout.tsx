import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans, IM_Fell_English_SC, UnifrakturCook } from "next/font/google";
import { GameShell } from "@/components/game/game-shell";
import "./globals.css";

// Required routes for testing:
// "/barracks" "/soldier" "/training" "/inventory" "/equipment" "/armory" "/missions" "/hospital"

const fontDisplay = IM_Fell_English_SC({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const fontSerif = Alegreya({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontSans = Alegreya_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
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
        <GameShell>{children}</GameShell>
      </body>
    </html>
  );
}
