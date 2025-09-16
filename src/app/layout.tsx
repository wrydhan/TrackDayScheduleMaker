import type { Metadata } from "next";
import { Shippori_Mincho, M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const jpBody = M_PLUS_Rounded_1c({
  variable: "--font-jp-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const jpDisplay = Shippori_Mincho({
  variable: "--font-jp-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Track Day Schedule Maker",
  description: "Generate professional track day schedules for car racing events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jpBody.variable} ${jpDisplay.variable} antialiased bg-black text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
