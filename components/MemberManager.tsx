'use client';
import React, { useState, useMemo } from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Check, X, Shield, Users, Swords, ShieldAlert, Target, Search, Filter, Lock } from 'lucide-react';

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

export default function MemberManager({ 
  members, 
  guilds, 
  currentUser, 
  onRefresh, 
  showToast 
}: { 
  members: any[], 
  guilds: any[], 
  currentUser: any, 
  onRefresh: () => void, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  // [권한 에러 해결] DB의 칼럼 구조(is_admin: boolean)에 맞추어 권한 체크 로직을 수정합니다.
  const isAdmin = currentUser?.is_admin === true;

  // 신규 등록 폼 상태 관리
  const [characterName, setCharacterName] = useState('');
  const [className, setClassName] = useState('');
  const [selectedGuild, setSelectedGuild] = useState('');
  const [atk, setAtk] = useState<number | ''>('');
  const [def, setDef] = useState<number | ''>('');
  const [hit, setHit] = useState<number | ''>('');
  
  // 수정(Editing) 모드 상태 관리
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editGuild, setEditGuild] = useState('');
  const [editAtk, setEditAtk] = useState<number | ''>('');
  const [editDef, setEditDef] = useState<number | ''>('');
  const [editHit, setEditHit] = useState<number | ''>('');

  // 다중 검색 및 필터링 상태 조건
  const [searchName, setSearchName] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGuild, setFilterGuild] = useState('');

  // 신규 등록 핸들러
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) {
      showToast('권한이 없습니다. 관리자만 등록할 수 있습니다.', 'error');
      return;
    }
    if (!characterName) {
      showToast('캐릭터 명을 입력해주세요.', 'error');
      return;
    }
    if (!className) {
      showToast('직업을 선택해주세요.', 'error');
      return;
    }

    const finalGuildName = selectedGuild.trim() === '' ? null : selectedGuild;

    const { error } = await supabase.from('members').insert([{
      character_name: characterName,
      job_class: className,
      guild_name: finalGuildName,
      atk: Number(atk || 0),
      def: Number(def || 0),
      hit: Number(hit || 0)
    }]);

    if (error) {
      showToast('등록 실패: ' + error.message, 'error');
    } else {
      setCharacterName('');
      setClassName('');
      setSelectedGuild('');
      setAtk('');
      setDef('');
      setHit('');
      onRefresh();
      showToast('신규 길드원이 성공적으로 등록되었습니다.');
    }
  }

  // 삭제 핸들러
  async function handleDelete(id: number) {
    if (!isAdmin) {
      showToast('권한이 없습니다. 관리자만 삭제할 수 있습니다.', 'error');
      return;
    }
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      showToast('삭제 실패: ' + error.message, 'error');
    } else {
      onRefresh();
      showToast('길드원이 삭제되었습니다.');
    }
  }

  // 수정 모드 돌입
  function handleEditStart(member: any) {
    setEditingId(member.id);
    setEditClassName(member.job_class || ''); 
    setEditGuild(member.guild_name || '');
    setEditAtk(member.atk === 0 ? '' : member.atk ?? '');
    setEditDef(member.def === 0 ? '' : member.def ?? '');
    setEditHit(member.hit === 0 ? '' : member.hit ?? '');
  }

  // 수정사항 저장 핸들러
  async function handleSave(id: number) {
    if (!isAdmin) {
      showToast('권한이 없습니다.', 'error');
      return;
    }
    const finalGuildName = editGuild.trim() === '' ? null : editGuild;

    const { error } = await supabase.from('members')
      .update({ 
        job_class: editClassName, 
        guild_name: finalGuildName, 
        atk: Number(editAtk || 0),
        def: Number(editDef || 0),
        hit: Number(editHit || 0)
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

  // 다중 필터 및 검색 정밀 정제 연산 파트
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchName = m.character_name.toLowerCase().includes(searchName.toLowerCase().trim());
      const matchClass = filterClass === '' || m.job_class === filterClass;
      
      let matchGuild = true;
      if (filterGuild === 'none') {
        matchGuild = !m.guild_name;
      } else if (filterGuild !== '') {
        matchGuild = m.guild_name === filterGuild;
      }

      return matchName && matchClass && matchGuild;
    });
  }, [members, searchName, filterClass, filterGuild]);

  return (
    <div className="space-y-8">
      
      {/* 1. 신규 등록 폼 */}
      {isAdmin ? (
        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd} 
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4"
        >
          <div className="text-xs font-black text-sky-400 flex items-center gap-1.5 mb-1">
            <UserPlus size={14} /> 신규 인원 연합 데이터베이스 등록 (관리자 권한)
          </div>
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
                className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white cursor-pointer"
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
                className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white cursor-pointer"
              >
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
                value={atk} 
                onChange={(e) => setAtk(e.target.value === '' ? '' : Number(e.target.value))} 
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
                value={def} 
                onChange={(e) => setDef(e.target.value === '' ? '' : Number(e.target.value))} 
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
                value={hit} 
                onChange={(e) => setHit(e.target.value === '' ? '' : Number(e.target.value))} 
                placeholder="0" 
                className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white" 
              />
            </div>
            <button className="bg-sky-600 hover:bg-sky-500 p-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-pointer transition-all h-[46px]">
              <UserPlus size={18} /> 신규 등록
            </button>
          </div>
        </motion.form>
      ) : (
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <Lock size={14} className="text-amber-500" />
          <span>현재 <strong>일반 회원 조회 모드</strong>입니다. 명부 편집 및 등록은 관리자 마스터 계정만 가능합니다.</span>
        </div>
      )}

      {/* 2. 다중 검색/필터 패널 */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input 
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="캐릭터 이름 검색..."
            className="w-full bg-slate-900 border border-slate-800 pl-10 pr-3 py-2.5 rounded-xl text-xs font-semibold text-white outline-none focus:border-slate-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none cursor-pointer"
          >
            <option value="">모든 직업 필터</option>
            {classList.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <select
            value={filterGuild}
            onChange={(e) => setFilterGuild(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 outline-none cursor-pointer"
          >
            <option value="">모든 길드 필터</option>
            {guilds.map(g => <option key={g.id} value={g.guild_name}>{g.guild_name}</option>)}
          </select>
        </div>
      </div>

      {/* 3. 목록 리스트 */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-sky-400" />
            <h2 className="text-xl font-black text-white">등록된 길드원 목록 ({filteredMembers.length}명)</h2>
          </div>
          {(searchName || filterClass || filterGuild) && (
            <button 
              onClick={() => { setSearchName(''); setFilterClass(''); setFilterGuild(''); }}
              className="text-[11px] text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>
        
        <div className="divide-y divide-slate-800">
          {filteredMembers.map((m) => {
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
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs w-full outline-none text-white cursor-pointer"
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
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs w-full outline-none text-white cursor-pointer"
                        >
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
                          onChange={(e) => setEditAtk(e.target.value === '' ? '' : Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-blue-400">방어력</label>
                        <input 
                          type="number" 
                          value={editDef} 
                          onChange={(e) => setEditDef(e.target.value === '' ? '' : Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-emerald-400">명중도</label>
                        <input 
                          type="number" 
                          value={editHit} 
                          onChange={(e) => setEditHit(e.target.value === '' ? '' : Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-full text-white"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-amber-400 font-bold">
                      예상 합계: {(Number(editAtk || 0) + Number(editDef || 0) + Number(editHit || 0)).toLocaleString()}
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

                {/* 관리자에게만 제어 액션 버튼 노출 */}
                {isAdmin && (
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
                )}
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="text-center text-slate-500 py-12 text-sm italic">
              조건에 부합하는 연합 대원이 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}