import './globals.css';
import Script from 'next/script';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Creative Studio AI Assistant',
  description: 'Your all-in-one creative assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans">
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
