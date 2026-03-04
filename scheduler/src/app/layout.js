import "./globals.css";
import {useState} from "react";
import Providers from "./providers"; 
import { Geist, Geist_Mono as GeistMono } from "next/font/google"; 
import { UIProvider } from "@/context/UIContext";   //all pages share global states using context
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
  // const [notiShowModal, setShowModal] = useState(false);

  // const handleShowModal = () => {
  //   setShowModal(!notiShowModal);
  // };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <UIProvider>
            {children}
            <div id="modal-root"></div>
          </UIProvider>          
        </Providers>
      </body>
    </html>
  );
}
