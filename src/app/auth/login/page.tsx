'use client';

import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithKakao } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* 배경 격자 패턴 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(192,132,252,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(244,114,182,0.12) 1px, transparent 1px)
          `,
          backgroundSize: '90px 90px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* 카드 */}
      <div className="relative text-center px-12 py-16 rounded-2xl border border-zinc-700/60 bg-zinc-900/50 backdrop-blur-sm shadow-2xl shadow-purple-500/10">
        {/* 카드 상단 그라데이션 라인 */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Tasticord</h1>
        <p className="text-zinc-400 mb-12 text-lg">당신의 취향을 한눈에</p>

        {/* 구분선 */}
        <div className="w-16 h-px bg-zinc-600 mx-auto mb-12" />

        <button
          onClick={signInWithKakao}
          className="w-80 py-4 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-base hover:bg-[#FDD835] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#191919">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.513 6.467-.163.588-.591 2.137-.677 2.472-.107.413.152.407.32.296.131-.087 2.09-1.42 2.934-1.996.93.133 1.893.202 2.873.202C17.523 18.132 22 14.67 22 10.441 22 6.213 17.523 3 12 3z" />
          </svg>
          카카오톡으로 시작하기
        </button>

        {/* 카드 하단 그라데이션 라인 */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
      </div>
    </div>
  );
}
