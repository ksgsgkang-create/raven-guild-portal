'use client';
import React from 'react';

export default function NoticeBoardList({ notices }: { notices: any[] }) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="font-bold text-amber-400 mb-4 text-lg">📢 공지사항</h3>
      {notices.length === 0 ? (
        <p className="text-sm text-slate-500 italic">등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="border-b border-slate-700 pb-3 last:border-0">
              <h4 className="font-bold text-white text-sm break-all">{n.title}</h4>
              {/* break-words와 whitespace-pre-wrap을 추가하여 긴 글도 줄바꿈되게 합니다 */}
              <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {n.content}
              </p>
              <div className="text-[10px] text-slate-600 mt-2">
                {new Date(n.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}