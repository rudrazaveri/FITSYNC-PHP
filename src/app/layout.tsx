import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'FitSync AI — Intelligent Multi-Gym Fitness, Health & Personalized Coaching',
  description: 'Production full-stack platform uniting gym members, certified trainers, multi-branch gym owners, sports medicine physicians, and physiotherapists.',
  icons: {
    icon: '/assets/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas-base text-gray-100 min-h-screen antialiased selection:bg-fitness-primary selection:text-black">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
