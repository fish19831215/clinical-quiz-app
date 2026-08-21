import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '臨床照護情境互動測驗系統',
  description: '內科病房品管專案 - 降低護理人員延遲下班精實交班訓練系統',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full bg-slate-950 text-slate-100 antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-950`}>
        {/* Mobile View Container Wrapper */}
        <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-900 shadow-2xl relative border-x border-slate-800/80">
          {children}
        </div>
      </body>
    </html>
  );
}
