import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Freelancer Command Center",
  description: "Track clients, earnings, and forecasts in one place",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jakartaSans.className} antialiased graphite-bg min-h-screen font-light text-white`}
      >
        {children}
      </body>
    </html>
  );
}
