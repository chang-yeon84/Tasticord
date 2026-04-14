'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Home, Heart, Activity, MessageCircle, Users, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const pathnameRef = useRef(pathname);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let userId: string | null = null;

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // 내가 참여한 채팅방의 last_read_at 가져오기
      const { data: memberships } = await supabase
        .from('chat_members')
        .select('room_id, last_read_at')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) return;

      let total = 0;
      for (const m of memberships) {
        if (!m.last_read_at) continue;
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', m.room_id)
          .gt('created_at', m.last_read_at)
          .neq('sender_id', user.id);
        total += count || 0;
      }
      setUnreadCount(total);
    }

    fetchUnread();

    // 새 메시지 수신 시 카운트 갱신
    const channel = supabase
      .channel('mobile-nav-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as { sender_id: string; room_id: string };
          if (newMsg.sender_id !== userId) {
            // 현재 해당 채팅방을 보고 있으면 카운트 증가하지 않음
            if (pathnameRef.current === `/messages/${newMsg.room_id}`) return;
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 메시지 페이지에 있으면 카운트 리셋
  useEffect(() => {
    if (pathname.startsWith('/messages')) {
      setUnreadCount(0);
    }
  }, [pathname]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          const showBadge = href === '/messages' && unreadCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 text-[10px] transition ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
              {label}
              {showBadge && (
                <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-purple-600 text-[9px] font-bold flex items-center justify-center text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
