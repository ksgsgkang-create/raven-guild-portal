'use client';
import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Shield, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

const classList = [
  '뱅가드', '버서커', '디스트로이어', '나이트레인저', '엘리멘탈리스트', 
  '디바인캐스터', '어쌔신', '데스브링어', '건슬링어', '워로드'
];

type SortKey = 'name' | 'job' | 'power' | 'guild';
type SortOrder = 'asc' | 'desc';
interface SortConfig {
  key: SortKey;
  order: SortOrder;
}

export default function MemberStatus({ members, guilds }: { members: any[], guilds: any[] }) {
  // 검색 및 필터링 상태
  const [searchName, setSearchName] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGuild, setFilterGuild] = useState('');
  
  // 다중 복합 정렬 큐 상태 (클릭한 순서대로 정렬 조건 누적)
  const [sortQueue, setSortQueue] = useState<SortConfig[]>([]);

  // 정렬 버튼 클릭 핸들러 (없음 -> 오름차순 -> 내림차순 -> 없음)
  const handleSortToggle = (key: SortKey) => {
    setSortQueue(prev => {
      const existingIndex = prev.findIndex(item => item.key === key);
      
      if (existingIndex === -1) {
        // 새로 클릭 시 오름차순(asc) 추가
        return [...prev, { key, order: 'asc' }];
      } else if (prev[existingIndex].order === 'asc') {
        // 이미 오름차순이면 내림차순(desc)으로 변경
        const nextQueue = [...prev];
        nextQueue[existingIndex] = { key, order: 'desc' };
        return nextQueue;
      } else {
        // 이미 내림차순이면 해당 정렬 제거
        return prev.filter(item => item.key !== key);
      }
    });
  };

  // 현재 정렬 조건 가져오기 편하게 맵으로 생성
  const sortMap = useMemo(() => {
    const map: Record<SortKey, SortConfig | null> = { name: null, job: null, power: null, guild: null };
    sortQueue.forEach((item) => {
      map[item.key] = { ...item };
    });
    return map;
  }, [sortQueue]);

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
    }).sort((a, b) => {
      // sortQueue에 쌓인 순서대로 순차 비교
      for (const sort of sortQueue) {
        const { key, order } = sort;
        const multiplier = order === 'asc' ? 1 : -1;

        let comparison = 0;

        if (key === 'name') {
          comparison = a.character_name.localeCompare(b.character_name, 'ko-KR');
        } else if (key === 'job') {
          comparison = a.job_class.localeCompare(b.job_class, 'ko-KR');
        } else if (key === 'guild') {
          const guildA = a.guild_name || '';
          const guildB = b.guild_name || '';
          comparison = guildA.localeCompare(guildB, 'ko-KR');
        } else if (key === 'power') {
          const totalA = (a.atk || 0) + (a.def || 0) + (a.hit || 0);
          const totalB = (b.atk || 0) + (b.def || 0) + (b.hit || 0);
          comparison = totalA - totalB;
        }

        if (comparison !== 0) {
          return comparison * multiplier;
        }
      }
      return 0;
    });
  }, [members, searchName, filterClass, filterGuild, sortQueue]);

  return (
    <div className="space-y-8 text-slate-100 font-sans">
      {/* 1. 상세 검색 & 필터 패널 */}
      <div className="bg-[#070a12]/80 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] space-y-6">
        <h3 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 flex items-center gap-3 tracking-tight border-b border-slate-800/80 pb-5">
          <Search className="text-cyan-400 shrink-0" size={22} /> 상세 검색 및 필터 조건
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-slate-500" size={20} />
            <input 
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="캐릭터 이름 검색..."
              className="w-full bg-slate-950 border-2 border-slate-800/80 pl-12 pr-5 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-violet-500/80 transition-all placeholder:text-slate-500 shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-4 bg-slate-950 border-2 border-slate-800/80 px-5 py-4 rounded-2xl shadow-inner relative">
            <Filter size={20} className="text-slate-500 shrink-0" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-transparent text-sm font-black text-slate-200 outline-none cursor-pointer appearance-none"
            >
              <option value="">모든 직업 필터</option>
              {classList.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 border-2 border-slate-800/80 px-5 py-4 rounded-2xl shadow-inner relative">
            <Filter size={20} className="text-slate-500 shrink-0" />
            <select
              value={filterGuild}
              onChange={(e) => setFilterGuild(e.target.value)}
              className="w-full bg-transparent text-sm font-black text-slate-200 outline-none cursor-pointer appearance-none"
            >
              <option value="">모든 길드 필터</option>
              {guilds.map(g => <option key={g.id} value={g.guild_name}>{g.guild_name}</option>)}
            </select>
          </div>
        </div>

        {/* 다중 조합 정렬 버튼 패널 */}
        <div className="pt-5 border-t border-slate-800/60 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] text-slate-400 font-black tracking-wider uppercase flex items-center gap-2">
              <Sparkles size={14} className="text-violet-400" /> 정렬 기준 (다중 우선순위 조합 가능)
            </label>
            {sortQueue.length > 0 && (
              <button 
                onClick={() => setSortQueue([])}
                className="text-xs text-rose-400 hover:underline font-extrabold cursor-pointer select-none"
              >
                정렬 초기화
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['name', 'job', 'power', 'guild'] as SortKey[]).map((key) => {
              const isActive = !!sortMap[key];
              const order = sortMap[key]?.order;
              const priority = sortQueue.findIndex(item => item.key === key);

              const labelMap: Record<SortKey, string> = {
                name: '이름순',
                job: '직업순',
                power: '전투력순',
                guild: '길드순'
              };

              return (
                <button 
                  key={key}
                  onClick={() => handleSortToggle(key)}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold text-xs cursor-pointer border-2 transition-all select-none
                    ${isActive 
                      ? 'bg-violet-600/15 border-violet-500/80 text-violet-300 shadow-[0_0_15px_-3px_rgba(109,40,217,0.3)]' 
                      : 'bg-[#0b0f19] border-slate-800/80 text-slate-400 hover:border-slate-700/60 hover:bg-slate-900/40'}`}
                >
                  {labelMap[key]}
                  {isActive && order === 'asc' && <ArrowUp size={16} className="text-violet-400" />}
                  {isActive && order === 'desc' && <ArrowDown size={16} className="text-violet-400" />}
                  {isActive && (
                    <span className="bg-violet-500 text-slate-950 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black shadow-md font-mono">
                      {priority + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. 연합 리스트 목록 */}
      <div className="bg-[#070a12]/80 backdrop-blur-xl a-rounded-[32px] rounded-[32px] border border-slate-800/80 overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Users className="text-cyan-400" size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">등록된 연합 리스트 <span className="text-cyan-400 font-mono ml-2 tracking-tighter">({filteredMembers.length}명)</span></h2>
          </div>
          {(searchName || filterClass || filterGuild) && (
            <button 
              onClick={() => { setSearchName(''); setFilterClass(''); setFilterGuild(''); }}
              className="text-xs text-cyan-400 hover:underline font-black cursor-pointer select-none tracking-tight"
            >
              검색 및 필터 초기화
            </button>
          )}
        </div>
        
        <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
          {filteredMembers.map((m) => {
            const totalStats = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
            return (
              <div key={m.id} className="p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-900/40 transition-all duration-300">
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* 이름 및 소속 */}
                  <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="font-black text-white text-lg min-w-[140px] tracking-tight">{m.character_name}</div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="bg-cyan-950/50 border border-cyan-800/60 px-5 py-2 rounded-xl font-extrabold text-cyan-300 tracking-tight">
                        {m.job_class}
                      </span>
                      <span className="bg-slate-950 border border-slate-800 px-5 py-2 rounded-xl font-black text-slate-300 flex items-center gap-2.5 tracking-tight">
                        <Shield size={16} className="text-amber-500 shrink-0" /> {m.guild_name || '무소속'}
                      </span>
                    </div>
                  </div>

                  {/* 전투력 상세 박스 */}
                  <div className="flex flex-wrap items-center gap-5 bg-slate-950/60 px-8 py-4 rounded-2xl border border-slate-800/80 text-sm shadow-inner">
                    <div className="flex items-center gap-3"><span className="text-rose-400 font-black text-xs uppercase tracking-wider">공격력</span> <span className="text-slate-100 font-mono font-extrabold tracking-tight">{(m.atk || 0).toLocaleString()}</span></div>
                    <div className="w-[1px] h-4 bg-slate-800 hidden sm:block" />
                    <div className="flex items-center gap-3"><span className="text-blue-400 font-black text-xs uppercase tracking-wider">방어력</span> <span className="text-slate-100 font-mono font-extrabold tracking-tight">{(m.def || 0).toLocaleString()}</span></div>
                    <div className="w-[1px] h-4 bg-slate-800 hidden sm:block" />
                    <div className="flex items-center gap-3"><span className="text-emerald-400 font-black text-xs uppercase tracking-wider">명중</span> <span className="text-slate-100 font-mono font-extrabold tracking-tight">{(m.hit || 0).toLocaleString()}</span></div>
                    <div className="w-[1px] h-4 bg-slate-700 hidden sm:block" />
                    <div className="flex items-center gap-4 bg-amber-950/30 px-5 py-2.5 rounded-xl border border-amber-900/50">
                      <span className="text-amber-400 font-black text-[11px] tracking-widest uppercase">합계 전투력</span> 
                      <span className="text-amber-300 font-black font-mono tracking-tight text-base">{totalStats.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="text-center text-slate-600 py-16 text-sm font-bold tracking-tight">
              조건에 부합하는 연합 대원이 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}