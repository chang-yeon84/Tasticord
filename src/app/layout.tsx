import type { Metadata } from 'next';
import { Outfit, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: 'Tasticord - 소셜 취향 공유',
  description: '친구들의 음악, 게임, 영화 취향을 한눈에',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={`${outfit.variable} ${notoSansKr.variable} font-sans bg-[#09090b] text-zinc-200 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
