import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VedaAI — Exam Grader",
  description:
    "Upload a question paper and a student's answer sheet to extract questions, map answers, and grade automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
