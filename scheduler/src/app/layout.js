"use client";

import "./globals.css";
import {useState} from "react";
import Providers from "./providers"; 
import { Geist, Geist_Mono as GeistMono } from "next/font/google"; 

import { AppSidebar } from "@/src/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/src/components/ui/sidebar";
import NotificationModal from "./components/NotificationModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata = {
//   title: "Scheduler",
//   description: "Time management app",
//   title: "Scheduler",
//   description: "Time management app",
// };

export default function RootLayout({ children }) {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => {
    setShowModal(!showModal);
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
          {showModal && <NotificationModal handleShowModal={handleShowModal} />}
          <div id="modal-root"></div>
        </Providers>
      </body>
    </html>
  );
}