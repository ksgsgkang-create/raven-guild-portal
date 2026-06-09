'use client';
import React from 'react';
import { supabase } from '../app/supabase';
import { Trash2 } from 'lucide-react';

export default function NoticeBoardList({ notices, currentUser, onRefresh, showToast }: { notices: any[], currentUser: any, onRefresh: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  
  async function handleDeleteNotice(id: number) {
    if (!confirm('해당 공지사항을 삭제하시겠습니까?')) return;
    
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      showToast('공지 삭제 실패: ' + error.message, 'error');
    } else {
      showToast('공지사항이 삭제되었습니다.');
      onRefresh();
    }
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="font-bold text-amber-400 mb-4 text-lg">📢 공지사항</h3>
      {notices.length === 0 ? (
        <p className="text-sm text-slate-500 italic">등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="border-b border-slate-700 pb-3 last:border-0 relative group">
              <h4 className="font-bold text-white text-sm break-all pr-6">{n.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {n.content}
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-600 mt-2">
                <span>{new Date(n.created_at).toLocaleDateString()}</span>
                {/* 관리자 삭제 버튼 */}
                {currentUser?.is_admin && (
                  <button 
                    onClick={() => handleDeleteNotice(n.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 cursor-pointer"
                    title="공지 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}