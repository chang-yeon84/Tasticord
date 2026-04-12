'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, Film } from 'lucide-react';

/**
 * 넷플릭스 시청 기록 CSV 업로드 컴포넌트
 *
 * 상태 흐름:
 * idle → uploading → success / error
 *
 * 사용자가 CSV 파일을 선택하면 /api/netflix/upload로 전송하고
 * 결과에 따라 성공/실패 메시지를 표시합니다.
 */

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface NetflixUploadProps {
  onUploadComplete?: () => void;
}

export default function NetflixUpload({ onUploadComplete }: NetflixUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 파일 선택 시 자동으로 업로드 시작
   * - CSV 파일만 허용
   * - FormData로 감싸서 API에 POST 전송
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // CSV 파일 확인
    if (!file.name.endsWith('.csv')) {
      setStatus('error');
      setMessage('CSV 파일만 업로드 가능합니다');
      return;
    }

    setStatus('uploading');
    setMessage('');
    setCount(0);

    try {
      // FormData에 파일 담아서 API로 전송
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/netflix/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 업로드 성공
        setStatus('success');
        setCount(data.count);
        setMessage(data.message);
        onUploadComplete?.();
      } else {
        // 서버에서 에러 반환
        setStatus('error');
        setMessage(data.error || '업로드에 실패했습니다');
      }
    } catch {
      // 네트워크 에러 등
      setStatus('error');
      setMessage('업로드 중 오류가 발생했습니다');
    }

    // 같은 파일 재업로드 가능하도록 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/35 rounded-2xl p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <Film className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-semibold">Netflix 시청 기록</h3>
      </div>

      {/* 상태별 UI */}
      {status === 'idle' && (
        <div>
          <p className="text-xs text-zinc-500 mb-4">
            넷플릭스에서 다운로드한 시청 기록 CSV 파일을 업로드하세요
          </p>
          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer transition">
            <Upload className="w-4 h-4" />
            CSV 파일 선택
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {status === 'uploading' && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          <span className="text-sm text-zinc-400">시청 기록을 분석하고 있습니다...</span>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-green-400 font-medium">{message}</span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            총 {count}개의 작품이 저장되었습니다
          </p>
          {/* 재업로드 버튼 */}
          <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-600 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            다시 업로드
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-400 font-medium">{message}</span>
          </div>
          {/* 재시도 버튼 */}
          <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-600 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            다시 시도
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
