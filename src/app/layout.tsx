import type { Metadata } from "next";
import { Heebo } from "next/font/google"; // פונט שיותר מתאים לעברית מ-Geist
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/providers/AuthProvider";

// החלפנו לפונט Heebo שהוא סטנדרטי ונקי בעברית
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "Tash Agent | IDF",
  description: "מערכת ניהול ת\"ש חכמה",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1", // קריטי למובייל!
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={cn(heebo.className, "bg-slate-50 antialiased overflow-hidden")}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}