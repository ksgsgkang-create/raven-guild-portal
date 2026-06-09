'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';
import { ShieldAlert, Users, Megaphone } from 'lucide-react';

export default function GuildAdminManager({ 
  allUsers, 
  isAdmin, 
  onRefresh, 
  showToast 
}: { 
  allUsers: any[], 
  isAdmin: any, 
  onRefresh: () => void, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  // 공지사항 작성용 상태 관리
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // 가입 승인/거절 처리
  async function handleUserAction(characterName: string, action: 'approve' | 'reject') {
    if (action === 'approve') {
      const { error } = await supabase.from('user_accounts').update({ is_approved: true }).eq('character_name', characterName);
      if (error) showToast('승인 처리 실패: ' + error.message, 'error');
      else showToast('가입을 승인했습니다.', 'success');
    } else {
      if (!confirm('정말 가입을 거절(삭제)하시겠습니까?')) return;
      const { error } = await supabase.from('user_accounts').delete().eq('character_name', characterName);
      if (error) showToast('거절 처리 실패: ' + error.message, 'error');
      else showToast('가입 신청을 거절했습니다.', 'success');
    }
    onRefresh();
  }

  // 공지사항 등록
  async function handlePostNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    
    const { error } = await supabase.from('notices').insert([{ title: noticeTitle.trim(), content: noticeContent.trim() }]);
    
    if (error) {
      showToast('공지 게시 실패: ' + error.message, 'error');
    } else {
      setNoticeTitle('');
      setNoticeContent('');
      showToast('공지 등록 완료!', 'success');
      onRefresh();
    }
  }

  // 비관리자 접근 방어
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-400 font-bold flex items-center justify-center gap-2 bg-red-950/20 rounded-2xl border border-red-900/30">
        <ShieldAlert size={20} /> 최고 관리자 권한이 필요합니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. 웹 가입 승인 관리 판넬 */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-red-400 text-base flex items-center gap-2">
          <Users size={18} /> ⚙️ 웹 가입 승인 대기 명단
        </h3>
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {allUsers.filter(u => !u.is_approved).map(u => (
            <div key={u.character_name} className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
              <span className="font-bold text-white text-sm">{u.character_name}</span>
              <div className="space-x-2">
                <button onClick={() => handleUserAction(u.character_name, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all">승인</button>
                <button onClick={() => handleUserAction(u.character_name, 'reject')} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all">거절</button>
              </div>
            </div>
          ))}
          {allUsers.filter(u => !u.is_approved).length === 0 && (
            <div className="text-slate-500 text-xs italic py-2">현재 대기 중인 신규 가입 신청자가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 2. 연합 공지사항 작성 컴포넌트 */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
          <Megaphone size={18} /> 📢 연합 공지사항 게시판 관리
        </h3>
        <form onSubmit={handlePostNotice} className="space-y-2">
          <input 
            value={noticeTitle} 
            onChange={(e) => setNoticeTitle(e.target.value)} 
            placeholder="공지 제목을 입력하세요." 
            className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" 
          />
          <textarea 
            value={noticeContent} 
            onChange={(e) => setNoticeContent(e.target.value)} 
            placeholder="공지 상세 내용을 작성하세요." 
            className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500 h-24 resize-none" 
          />
          <button className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
            시스템 전체 공지 게시
          </button>
        </form>
      </div>

    </div>
  );
}