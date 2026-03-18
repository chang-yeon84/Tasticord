'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity, MessageCircle, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/analysis', label: '취향 분석', icon: Activity },
  { href: '/messages', label: '메시지', icon: MessageCircle },
  { href: '/friends', label: '친구', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  return (
    <aside className="w-[240px] border-r border-zinc-800/60 p-5 flex flex-col justify-between flex-shrink-0">
      <div>
        <Link href="/" className="text-2xl font-bold mb-10 block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent px-2">
          Tasticord
        </Link>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-sm transition-all ${
                  isActive
                    ? 'text-white font-semibold bg-zinc-800/60'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
                {label === '메시지' && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <Link
        href="/profile"
        className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-3 flex items-center space-x-3 hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
      >
        <Avatar name={currentUser?.nickname || '나'} imageUrl={currentUser?.avatar_url} size="sm" />
        <div className="text-sm min-w-0">
          <p className="font-semibold truncate">{currentUser?.nickname || '내 프로필'}</p>
          <p className="text-xs text-zinc-500">프로필 보기</p>
        </div>
      </Link>
    </aside>
  );
}
