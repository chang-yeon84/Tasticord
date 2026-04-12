'use client';

import { useState } from 'react';
import { Send, Plus } from 'lucide-react';
import AttachmentSheet from './AttachmentSheet';
import AttachmentPreview from './AttachmentPreview';
import type { EmbedType } from '@/types';

/**
 * 채팅 입력 컴포넌트
 *
 * 기능:
 * 1. 일반 텍스트 메시지 전송
 * 2. + 버튼으로 바텀 시트 열기 → 음악/게임/영화 카드 첨부
 * 3. 첨부된 카드는 입력창 위에 미리보기로 표시
 * 4. 전송 시:
 *    - 카드가 있으면 카드 전송 (onSendCard)
 *    - 카드가 없고 텍스트가 있으면 텍스트 전송 (onSend)
 */

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendCard?: (embedType: EmbedType, embedData: Record<string, unknown>) => void;
  onTyping?: () => void;
}

export default function ChatInput({ onSend, onSendCard, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  // 첨부된 카드 데이터 (선택 후 전송 전 상태)
  const [attachment, setAttachment] = useState<{ type: EmbedType; data: Record<string, unknown> } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 카드가 첨부되어 있으면 카드 전송 우선
    if (attachment && onSendCard) {
      onSendCard(attachment.type, attachment.data);
      setAttachment(null);
      setText('');
      return;
    }

    // 그 외에는 일반 텍스트 전송
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping?.();
  };

  // 바텀 시트에서 아이템 선택 시 호출
  const handleAttachmentSelect = (type: EmbedType, data: Record<string, unknown>) => {
    setAttachment({ type, data });
  };

  return (
    <div className="border-t border-zinc-800/50">
      {/* 첨부 미리보기 (카드가 선택된 경우에만 표시) */}
      {attachment && (
        <div className="pt-3">
          <AttachmentPreview
            embedType={attachment.type}
            embedData={attachment.data}
            onCancel={() => setAttachment(null)}
          />
        </div>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
        {/* + 버튼 (첨부) */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-300 flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* 텍스트 입력창 */}
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder={attachment ? '카드와 함께 보낼 메시지는 별도로 작성해주세요' : '메시지를 입력하세요...'}
          disabled={!!attachment}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3 text-sm placeholder-zinc-600 outline-none focus:border-zinc-600 transition disabled:opacity-50"
        />

        {/* 전송 버튼 */}
        <button
          type="submit"
          disabled={!attachment && !text.trim()}
          className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* 바텀 시트 */}
      <AttachmentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleAttachmentSelect}
      />
    </div>
  );
}
