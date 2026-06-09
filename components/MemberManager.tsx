'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Check, X, Shield, Users, Swords, ShieldAlert, Target } from 'lucide-react';

const classList = [
  '뱅가드', 
  '버서커', 
  '디스트로이어', 
  '나이트레인저', 
  '엘리멘탈리스트', 
  '디바인캐스터', 
  '어쌔신', 
  '데스브링어', 
  '건슬링어', 
  '워로드'
];

export default function MemberManager({ members, guilds, showToast, onRefresh }: { members: any[], guilds: any[], currentUser: any, showToast: (msg: string, type?: 'success' | 'error') => void, onRefresh: () => void }) {
  const [characterName, setCharacterName] = useState('');
  const [className, setClassName] = useState('');
  const [selectedGuild, setSelectedGuild] = useState('');
  const [atk, setAtk] = useState<number>(0);
  const [def, setDef] = useState<number>(0);
  const [hit, setHit] = useState<number>(0);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editGuild, setEditGuild] = useState('');
  const [editAtk, setEditAtk] = useState<number>(0);
  const [editDef, setEditDef] = useState<number>(0);
  const [editHit, setEditHit] = useState<number>(0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!characterName) {
      showToast('캐릭터 명을 입력해주세요.', 'error');
      return;
    }
    if (!className) {
      showToast('직업을 선택해주세요.', 'error');
      return;
    }

    // [외래키 에러 해결] 길드를 선택하지 않았거나 공백이면 빈 문자열 대신 null을 대입합니다.
    const finalGuildName = selectedGuild.trim() === '' ? null : selectedGuild;

    const { error } = await supabase.from('members').insert([{
      character_name: characterName,
      job_class: className,
      guild_name: finalGuildName,
      atk: Number(atk),
      def: Number(def),
      hit: Number(hit)
    }]);

    if (error) {
      showToast('등록 실패: ' + error.message, 'error');
    } else {
      setCharacterName('');
      setClassName('');
      setSelectedGuild('');
      setAtk(0);
      setDef(0);
      setHit(0);
      onRefresh();
      showToast('신규 길드원이 성공적으로 등록되었습니다.');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      showToast('삭제 실패: ' + error.message, 'error');
    } else {
      onRefresh();
      showToast('길드원이 삭제되었습니다.');
    }
  }

  function handleEditStart(member: any) {
    setEditingId(member.id);
    setEditClassName(member.job_class || ''); 
    setEditGuild(member.guild_name || '');
    setEditAtk(member.atk || 0);
    setEditDef(member.def || 0);
    setEditHit(member.hit || 0);
  }

  async function handleSave(id: number) {
    // [외래키 에러 해결] 길드 수정 시 공백 상태라면 Supabase 외래키 제약조건 통과를 위해 null로 매핑합니다.
    const finalGuildName = editGuild.trim() === '' ? null : editGuild;

    const { error } = await supabase.from('members')
      .update({ 
        job_class: editClassName, 
        guild_name: finalGuildName, 
        atk: Number(editAtk),
        def: Number(editDef),
        hit: Number(editHit)
      })
      .eq('id', id);

    if (error) {
      showToast('수정 실패: ' + error.message, 'error');
    } else {
      setEditingId(null);
      onRefresh();
      showToast('길드원 정보가 수정되었습니다.');
    }
  }

  return (
    <div className="space-y-8">
      {/* 등록 폼 */}
      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleAdd} 
        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">캐릭터 명</label>
            <input 
              value={characterName} 
              onChange={(e) => setCharacterName(e.target.value)} 
              placeholder="이름 입력" 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">직업 선택</label>
            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white"
            >
              <option value="">직업을 선택하세요</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">소속 길드</label>
            <select 
              value={selectedGuild} 
              onChange={(e) => setSelectedGuild(e.target.value)} 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white"
            >
              <option value="">무소속 (선택 안 함)</option>
              {guilds.map((g) => (
                <option key={g.id} value={g.guild_name}>{g.guild_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Swords size={12} className="text-red-400" /> 공격력
            </label>
            <input 
              type="number"
              value={atk || ''} 
              onChange={(e) => setAtk(Number(e.target.value))} 
              placeholder="0" 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
              <ShieldAlert size={12} className="text-blue-400" /> 방어력
            </label>
            <input 
              type="number"
              value={def || ''} 
              onChange={(e) => setDef(Number(e.target.value))} 
              placeholder="0" 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1 flex items-center gap-1">
              <Target size={12} className="text-emerald-400" /> 명중도
            </label>
            <input 
              type="number"
              value={hit || ''} 
              onChange={(e) => setHit(Number(e.target.value))} 
              placeholder="0" 
              className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white" 
            />
          </div>
          <button className="bg-sky-600 hover:bg-sky-500 p-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-pointer transition-all h-[46px]">
            <UserPlus size={18} /> 신규 등록
          </button>
        </div>
      </motion.form>

      {/* 목록 리스트 */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <Users className="text-sky-400" />
          <h2 className="text-xl font-black text-white">등록된 길드원 목록 ({members.length}명)</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {members.map((m) => {
            const totalStats = (m.atk || 0) + (m.def || 0) + (m.hit || 0);

            return (
              <div key={m.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                {editingId === m.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">이름</span> {m.character_name}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] text-slate-500">직업 수정</label>
                        <select 
                          value={editClassName} 
                          onChange={(e) => setEditClassName(e.target.value)} 
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs w-full outline-none text-white"
                        >
                          {classList.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500">길드 수정</label>
                        <select 
                          value={editGuild} 
                          onChange={(e) => setEditGuild(e.target.value)} 
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs w-full outline-none text-white"
                        >
                          <option value="">무소속 (선택 안 함)</option>
                          {guilds.map((g) => (
                            <option key={g.id} value={g.guild_name}>{g.guild_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-red-400">공격력</label>
                        <input 
                          type="number" 
                          value={editAtk} 
                          onChange={(e) => setEditAtk(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-blue-400">방어력</label>
                        <input 
                          type="number" 
                          value={editDef} 
                          onChange={(e) => setEditDef(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-emerald-400">명중도</label>
                        <input 
                          type="number" 
                          value={editHit} 
                          onChange={(e) => setEditHit(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-amber-400 font-bold">
                      예상 합계: {(Number(editAtk) + Number(editDef) + Number(editHit)).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="font-bold text-white text-lg min-w-[140px]">{m.character_name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span className="bg-sky-950/40 border border-sky-800/60 px-2.5 py-0.5 rounded-full text-xs font-semibold text-sky-300">
                          {m.job_class}
                        </span>
                        <span className="bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <Shield size={12} className="text-amber-500" /> {m.guild_name || '무소속'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-1"><span className="text-red-400 font-bold">공</span> <span className="text-slate-300">{(m.atk || 0).toLocaleString()}</span></div>
                      <div className="w-[1px] h-3 bg-slate-800" />
                      <div className="flex items-center gap-1"><span className="text-blue-400 font-bold">방</span> <span className="text-slate-300">{(m.def || 0).toLocaleString()}</span></div>
                      <div className="w-[1px] h-3 bg-slate-800" />
                      <div className="flex items-center gap-1"><span className="text-emerald-400 font-bold">명</span> <span className="text-slate-300">{(m.hit || 0).toLocaleString()}</span></div>
                      <div className="w-[1px] h-3 bg-slate-700" />
                      <div className="flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                        <span className="text-amber-400 font-black">합계</span> 
                        <span className="text-amber-300 font-bold">{totalStats.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 self-end lg:self-center">
                  {editingId === m.id ? (
                    <>
                      <button onClick={() => handleSave(m.id)} className="bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-xl cursor-pointer text-white"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-xl cursor-pointer text-white"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditStart(m)} className="bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 p-2.5 rounded-xl cursor-pointer border border-sky-500/30"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(m.id)} className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-2.5 rounded-xl cursor-pointer border border-red-800/30"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}