'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';

interface Props {
  guilds: any[];
  allUsers: any[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function GuildAdminManager({ 
  guilds, 
  allUsers, 
  isAdmin, 
  onRefresh, 
  showToast 
}: { 
  guilds: any[], 
  allUsers: any[], 
  isAdmin: any, 
  onRefresh: () => void, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  const [newGuild, setNewGuild] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // 길드 추가
  async function handleAddGuild(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuild) return;
    await supabase.from('alliance_guilds').insert([{ guild_name: newGuild }]);
    setNewGuild('');
    onRefresh();
  }

  // 승인/거절 처리 (ID 대신 character_name 사용)
  async function handleUserAction(characterName: string, action: 'approve' | 'reject') {
    if (action === 'approve') {
      await supabase.from('user_accounts').update({ is_approved: true }).eq('character_name', characterName);
    } else {
      if (!confirm('정말 가입을 거절(삭제)하시겠습니까?')) return;
      await supabase.from('user_accounts').delete().eq('character_name', characterName);
    }
    onRefresh();
  }

  // 공지사항 등록
async function handlePostNotice(e: React.FormEvent) {
  e.preventDefault();
  if (!noticeTitle || !noticeContent) return;
  
  const { error } = await supabase.from('notices').insert([{ title: noticeTitle, content: noticeContent }]);
  
  if (error) {
    alert('공지 게시 실패: ' + error.message);
  } else {
    setNoticeTitle('');
    setNoticeContent('');
    alert('공지 등록 완료!');
    onRefresh(); // <-- 이 부분이 핵심! 메인 페이지 데이터를 새로고침합니다.
  }
}

  return (
    <div className="space-y-8">
      {/* 1. 승인 관리 (관리자만) */}
      {isAdmin && (
        <div className="bg-slate-800 p-6 rounded-lg border border-red-900">
          <h3 className="font-bold text-red-400 mb-4">⚙️ 웹 가입 승인 대기</h3>
          <div className="space-y-2">
            {allUsers.filter(u => !u.is_approved).map(u => (
              <div key={u.character_name} className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-700">
                <span className="font-bold">{u.character_name}</span>
                <div className="space-x-2">
                  <button onClick={() => handleUserAction(u.character_name, 'approve')} className="bg-emerald-600 px-3 py-1 rounded text-xs">승인</button>
                  <button onClick={() => handleUserAction(u.character_name, 'reject')} className="bg-red-700 px-3 py-1 rounded text-xs">거절</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 길드 관리 및 공지사항 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="font-bold text-sky-400 mb-4">🏰 전국구 길드 관리</h3>
          {isAdmin && (
            <form onSubmit={handleAddGuild} className="flex gap-2 mb-4">
              <input value={newGuild} onChange={(e) => setNewGuild(e.target.value)} className="flex-1 bg-slate-900 p-2 rounded border border-slate-600" placeholder="새 길드명" />
              <button className="bg-sky-600 px-4 py-2 rounded font-bold">추가</button>
            </form>
          )}
          <div className="grid grid-cols-2 gap-2">
            {guilds.map(g => <div key={g.id} className="bg-slate-900 p-2 rounded text-center border border-slate-700 text-sm">🛡️ {g.guild_name}</div>)}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="font-bold text-amber-400 mb-4">📢 공지사항 작성</h3>
            <form onSubmit={handlePostNotice} className="space-y-2">
              <input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="제목" className="w-full bg-slate-900 p-2 rounded border border-slate-600" />
              <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} placeholder="내용" className="w-full bg-slate-900 p-2 rounded border border-slate-600 h-20" />
              <button className="w-full bg-amber-600 py-2 rounded font-bold">공지 게시</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}