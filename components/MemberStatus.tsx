'use client';
import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Shield, ArrowUp, ArrowDown } from 'lucide-react';

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
    sortQueue.forEach((item, index) => {
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
    <div className="space-y-6">
      {/* 1. 상세 검색 & 필터 패널 */}
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

        {/* 다중 조합 정렬 버튼 패널 */}
        <div className="pt-3 border-t border-slate-800/60 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-slate-400 font-bold">정렬 기준 (다중 선택 및 우선순위 조합 가능)</label>
            {sortQueue.length > 0 && (
              <button 
                onClick={() => setSortQueue([])}
                className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
              >
                정렬 초기화
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['name', 'job', 'power', 'guild'] as SortKey[]).map((key) => {
              const isActive = !!sortMap[key];
              const order = sortMap[key]?.order;
              // 몇 번째 우선순위로 적용되었는지 인덱스 표시
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
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                    isActive 
                      ? 'bg-sky-600/20 border-sky-500 text-sky-300' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {labelMap[key]}
                  {isActive && order === 'asc' && <ArrowUp size={14} className="text-sky-400" />}
                  {isActive && order === 'desc' && <ArrowDown size={14} className="text-sky-400" />}
                  {isActive && (
                    <span className="bg-sky-500 text-slate-950 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black">
                      {priority + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. 길드원 목록 리스트 */}
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
              검색 및 필터 초기화
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