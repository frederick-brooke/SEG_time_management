import "./globals.css";
import Providers from "./providers"; 
import { Geist, Geist_Mono as GeistMono } from "next/font/google"; 

import { AppSidebar } from "@/src/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Scheduler",
  description: "Time management app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <SidebarProvider>
            <AppSidebar />

            <SidebarInset className="test">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
