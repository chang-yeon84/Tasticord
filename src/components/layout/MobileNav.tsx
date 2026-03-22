'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Activity, MessageCircle, Users, User } from 'lucide-react';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/my-taste', label: '내 취향', icon: Heart },
  { href: '/analysis', label: '분석', icon: Activity },
  { href: '/messages', label: '메시지', icon: MessageCircle },
  { href: '/friends', label: '친구', icon: Users },
  { href: '/profile', label: '프로필', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] transition ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
