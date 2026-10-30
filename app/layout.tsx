import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "FitLog — Training, tracked.",
  description: "A focused home for your workouts, routines, and progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
