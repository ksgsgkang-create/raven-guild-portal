'use client';
import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Shield, Swords, ShieldAlert, Target, ArrowUpDown } from 'lucide-react';

const classList = [
  '뱅가드', '버서커', '디스트로이어', '나이트레인저', '엘리멘탈리스트', 
  '디바인캐스터', '어쌔신', '데스브링어', '건슬링어', '워로드'
];

export default function MemberStatus({ members, guilds }: { members: any[], guilds: any[] }) {
  // 검색 및 필터링 상태
  const [searchName, setSearchName] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGuild, setFilterGuild] = useState('');
  
  // [추가된 상세 검색 조건 예시] 전투력 범위 검색
  const [minAtk, setMinAtk] = useState<number | ''>('');
  const [minTotal, setMinTotal] = useState<number | ''>('');
  
  // 정렬 상태 (기본값: 합계 내림차순)
  const [sortBy, setSortBy] = useState<'name' | 'stat' | 'atk'>('stat');

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

      // 전투력 상세 필터 로직
      const totalStats = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
      const matchAtk = minAtk === '' || (m.atk || 0) >= minAtk;
      const matchTotal = minTotal === '' || totalStats >= minTotal;

      return matchName && matchClass && matchGuild && matchAtk && matchTotal;
    }).sort((a, b) => {
      const totalA = (a.atk || 0) + (a.def || 0) + (a.hit || 0);
      const totalB = (b.atk || 0) + (b.def || 0) + (b.hit || 0);
      
      if (sortBy === 'name') return a.character_name.localeCompare(b.character_name);
      if (sortBy === 'atk') return (b.atk || 0) - (a.atk || 0);
      return totalB - totalA; // stat 기준 기본 내림차순
    });
  }, [members, searchName, filterClass, filterGuild, minAtk, minTotal, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. 상세 검색 & 필터 패널 (일반 유저용 고도화) */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          🔍 상세 검색 조건
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            <input 
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="캐릭터 이름 검색..."
              className="w-full bg-slate-950 border border-slate-800 pl-10 pr-3 py-3 rounded-xl text-xs font-semibold text-white outline-none focus:border-slate-700"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-3 rounded-xl text-xs font-bold text-slate-300 outline-none cursor-pointer"
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
              className="w-full bg-slate-950 border border-slate-800 px-3 py-3 rounded-xl text-xs font-bold text-slate-300 outline-none cursor-pointer"
            >
              <option value="">모든 길드 필터</option>
              <option value="none">무소속 단원</option>
              {guilds.map(g => <option key={g.id} value={g.guild_name}>{g.guild_name}</option>)}
            </select>
          </div>
        </div>

        {/* 부가적인 상세 검색 조건 (스펙 기준 필터 및 정렬) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 items-center">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">최소 공격력</label>
            <input 
              type="number" 
              value={minAtk} 
              onChange={(e) => setMinAtk(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="최소 공격력 입력"
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">최소 종합 전투력</label>
            <input 
              type="number" 
              value={minTotal} 
              onChange={(e) => setMinTotal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="최소 종합 전투력 입력"
              className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-xs text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">정렬 기준</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSortBy('stat')} 
                className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] cursor-pointer border ${sortBy === 'stat' ? 'bg-sky-600/20 border-sky-500 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                전투력 합계순
              </button>
              <button 
                onClick={() => setSortBy('atk')} 
                className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] cursor-pointer border ${sortBy === 'atk' ? 'bg-red-950/40 border-red-800/50 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                공격력순
              </button>
              <button 
                onClick={() => setSortBy('name')} 
                className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] cursor-pointer border ${sortBy === 'name' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
              >
                이름순
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 길드원 목록 리스트 (조회 전용) */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-sky-400" />
            <h2 className="text-xl font-black text-white">등록된 길드원 목록 ({filteredMembers.length}명)</h2>
          </div>
          {(searchName || filterClass || filterGuild || minAtk !== '' || minTotal !== '') && (
            <button 
              onClick={() => { setSearchName(''); setFilterClass(''); setFilterGuild(''); setMinAtk(''); setMinTotal(''); }}
              className="text-[11px] text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              필터 및 검색 초기화
            </button>
          )}
        </div>
        
        <div className="divide-y divide-slate-800">
          {filteredMembers.map((m) => {
            const totalStats = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
            return (
              <div key={m.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
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