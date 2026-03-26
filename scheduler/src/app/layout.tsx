import "./globals.css";
import "leaflet/dist/leaflet.css";
import Providers from "./providers"; 
import { Geist, Geist_Mono as GeistMono } from "next/font/google"; 
import { UIProvider } from "@/context/UIContext";  

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
