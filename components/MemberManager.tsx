'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';

interface MemberManagerProps {
  members: any[];
  guilds: any[];
  currentUser: any;
  onRefresh: () => void;
}

export default function MemberManager({ members, guilds, currentUser, onRefresh }: MemberManagerProps) {
  const [filter, setFilter] = useState('전체');
  const [newName, setNewName] = useState('');
  const [newGuild, setNewGuild] = useState(guilds.length > 0 ? guilds[0].guild_name : '전국구');
  const [newJob, setNewJob] = useState('뱅가드');

  const isAdmin = currentUser?.is_admin;

  // 길드별 필터링 로직
  const filteredMembers = filter === '전체' 
    ? members 
    : members.filter(m => m.guild_name === filter);

  // 신규 등록
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName) return alert('캐릭터명을 입력하세요.');

    const { error } = await supabase.from('members').insert([{ 
      character_name: newName, 
      guild_name: newGuild, 
      job_class: newJob 
    }]);

    if (error) {
      alert(`등록 실패: ${error.message}`);
    } else {
      alert('등록 성공!');
      setNewName('');
      onRefresh();
    }
  }

  // 추방
  async function handleKick(id: number, name: string) {
    if (!confirm(`${name}님을 정말 추방하시겠습니까?`)) return;
    await supabase.from('members').delete().eq('id', id);
    onRefresh();
  }

  // 관리자 권한 토글 (유저 관리 페이지용 로직)
  async function toggleAdmin(id: number, currentStatus: boolean) {
    if (!confirm(`관리자 권한을 ${currentStatus ? '해제' : '부여'}하시겠습니까?`)) return;
    await supabase.from('user_accounts').update({ is_admin: !currentStatus }).eq('id', id);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* 1. 필터링 버튼 */}
      <div className="flex gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
        <button onClick={() => setFilter('전체')} className={`px-4 py-1 rounded text-sm ${filter === '전체' ? 'bg-sky-600' : 'bg-slate-700'}`}>전체</button>
        {guilds.map(g => (
          <button key={g.id} onClick={() => setFilter(g.guild_name)} className={`px-4 py-1 rounded text-sm ${filter === g.guild_name ? 'bg-sky-600' : 'bg-slate-700'}`}>
            {g.guild_name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. 등록 폼 (관리자만 가능) */}
        {isAdmin && (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 h-fit">
            <h3 className="font-bold text-emerald-400 mb-4">➕ 신규 길드원 등록</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input placeholder="캐릭터명" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-900 p-2 rounded border border-slate-600" />
              <select value={newGuild} onChange={(e) => setNewGuild(e.target.value)} className="w-full bg-slate-900 p-2 rounded border border-slate-600">
                {guilds.map(g => <option key={g.id} value={g.guild_name}>{g.guild_name}</option>)}
              </select>
              <select value={newJob} onChange={(e) => setNewJob(e.target.value)} className="w-full bg-slate-900 p-2 rounded border border-slate-600">
                {['뱅가드', '버서커', '디스트로이어', '나이트레인저', '엘리멘탈리스트', '디바인캐스터', '어쌔신', '데스브링어', '건슬링어', '워로드'].map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
              <button type="submit" className="w-full bg-emerald-600 py-2 rounded font-bold hover:bg-emerald-700">등록하기</button>
            </form>
          </div>
        )}

        {/* 3. 리스트 테이블 */}
        <div className={`bg-slate-800 p-6 rounded-lg border border-slate-700 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="font-bold text-white mb-4">📋 명단 (총 {filteredMembers.length}명)</h3>
          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr><th className="pb-2">캐릭터명</th><th className="pb-2">소속</th><th className="pb-2">직업</th>{isAdmin && <th className="pb-2 text-center">관리</th>}</tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m.id} className="border-b border-slate-700/50">
                    <td className="py-3 text-amber-200 font-bold">{m.character_name}</td>
                    <td className="py-3 text-blue-300">{m.guild_name}</td>
                    <td className="py-3 text-slate-300">{m.job_class}</td>
                    {isAdmin && (
                      <td className="py-3 text-center space-x-2">
                        <button onClick={() => handleKick(m.id, m.character_name)} className="text-red-400 hover:text-red-300">추방</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}