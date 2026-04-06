import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Science Calculator',
  description: 'A production-ready scientific calculator built with Next.js 14'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
