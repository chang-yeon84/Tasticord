'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t border-zinc-800/50">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3 text-sm placeholder-zinc-600 outline-none focus:border-zinc-600 transition"
      />
      <button
        type="submit"
        className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
