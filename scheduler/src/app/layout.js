import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Scheduler",
  description: "Time management app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}