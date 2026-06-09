'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Check, X, Shield, Users } from 'lucide-react';

export default function MemberManager({ members, guilds, currentUser, onRefresh }: { members: any[], guilds: any[], currentUser: any, onRefresh: () => void }) {
  const [characterName, setCharacterName] = useState('');
  const [className, setClassName] = useState('');
  const [selectedGuild, setSelectedGuild] = useState('');
  
  // 수정 상태 관리
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editGuild, setEditGuild] = useState('');

  // 신규 인원 등록
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!characterName || !className || !selectedGuild) return;

    const { error } = await supabase.from('members').insert([{
      character_name: characterName,
      class_name: className,
      guild_name: selectedGuild
    }]);

    if (error) {
      alert('등록 실패: ' + error.message);
    } else {
      setCharacterName('');
      setClassName('');
      setSelectedGuild('');
      onRefresh();
    }
  }

  // 인원 삭제
  async function handleDelete(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      onRefresh();
    }
  }

  // 수정 시작
  function handleEditStart(member: any) {
    setEditingId(member.id);
    setEditClassName(member.class_name);
    setEditGuild(member.guild_name);
  }

  // 수정 저장
  async function handleSave(id: number) {
    const { error } = await supabase.from('members')
      .update({ class_name: editClassName, guild_name: editGuild })
      .eq('id', id);

    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      setEditingId(null);
      onRefresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* 신규 등록 폼 */}
      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAdd} 
        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs text-slate-400 font-bold mb-1">캐릭터 명</label>
          <input 
            value={characterName} 
            onChange={(e) => setCharacterName(e.target.value)} 
            placeholder="이름 입력" 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 font-bold mb-1">직업</label>
          <input 
            value={className} 
            onChange={(e) => setClassName(e.target.value)} 
            placeholder="직업 입력" 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm" 
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 font-bold mb-1">소속 길드</label>
          <select 
            value={selectedGuild} 
            onChange={(e) => setSelectedGuild(e.target.value)} 
            className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm"
          >
            <option value="">길드 선택</option>
            {guilds.map((g) => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>
        <button className="bg-sky-600 hover:bg-sky-500 p-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-pointer transition-all">
          <UserPlus size={18} /> 신규 등록
        </button>
      </motion.form>

      {/* 인원 목록 및 수정/삭제 */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <Users className="text-sky-400" />
          <h2 className="text-xl font-black text-white">등록된 길드원 목록 ({members.length}명)</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
              {editingId === m.id ? (
                // 수정 중일 때 화면
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">이름</span> {m.character_name}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">직업 수정</label>
                    <input 
                      value={editClassName} 
                      onChange={(e) => setEditClassName(e.target.value)} 
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-sky-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">길드 수정</label>
                    <select 
                      value={editGuild} 
                      onChange={(e) => setEditGuild(e.target.value)} 
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-sky-500"
                    >
                      {guilds.map((g) => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // 일반 조회 화면
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="font-bold text-white text-lg min-w-[200px]">{m.character_name}</div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-800/60 px-3 py-1 rounded-full text-xs font-semibold">
                      직업: <strong className="text-sky-300">{m.class_name}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-800/60 px-3 py-1 rounded-full text-xs font-semibold border border-slate-700">
                      <Shield size={14} className="text-amber-400" /> 소속: <strong className="text-amber-300">{m.guild_name}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* 버튼 영역 */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {editingId === m.id ? (
                  <>
                    <button 
                      onClick={() => handleSave(m.id)} 
                      className="bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-xl cursor-pointer transition-colors text-white"
                      title="저장"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-xl cursor-pointer transition-colors text-white"
                      title="취소"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleEditStart(m)} 
                      className="bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 p-2.5 rounded-xl cursor-pointer transition-colors border border-sky-500/30"
                      title="수정"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)} 
                      className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-2.5 rounded-xl cursor-pointer transition-colors border border-red-800/30"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}