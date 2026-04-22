import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Platform",
  description: "Plataforma de gestão da agência",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#0f172a",
          color: "#fff",
        }}
      >
        {children}
      </body>
    </html>
  );
}