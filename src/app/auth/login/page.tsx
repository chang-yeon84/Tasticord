'use client';

import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithKakao } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Tasticord</h1>
        <p className="text-zinc-500 mb-12 text-lg">친구들의 취향을 한눈에</p>
        <button
          onClick={signInWithKakao}
          className="w-80 py-4 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-base hover:bg-[#FDD835] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#191919">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.513 6.467-.163.588-.591 2.137-.677 2.472-.107.413.152.407.32.296.131-.087 2.09-1.42 2.934-1.996.93.133 1.893.202 2.873.202C17.523 18.132 22 14.67 22 10.441 22 6.213 17.523 3 12 3z"/>
          </svg>
          카카오톡으로 시작하기
        </button>
      </div>
    </div>
  );
}
