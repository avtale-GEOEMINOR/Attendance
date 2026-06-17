import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Register — Attendance for GE/OE Courses",
  description: "Course attendance tracking for faculty and students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-parchment text-ink">
        {children}
      </body>
    </html>
  );
}
