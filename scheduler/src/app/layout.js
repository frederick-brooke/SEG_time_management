import "./globals.css";
import Providers from "./providers";
import { Geist, Geist_Mono as GeistMono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = GeistMono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = { title: "Scheduler", description: "Time management app" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <div id="modal-root"></div>
        </Providers>
      </body>
    </html>
  );
}
