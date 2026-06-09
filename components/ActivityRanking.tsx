'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../app/supabase';
import { Trophy, CalendarDays, Swords, BarChart3, Crown, Award, Calendar, Shield, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#6366f1', '#14b8a6', '#f97316', '#64748b'];

export default function ActivityRanking({ members }: { members: any[] }) {
  const [subTab, setSubTab] = useState<'combat' | 'boss' | 'stats'>('combat');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [rawRaidLogs, setRawRaidLogs] = useState<any[]>([]);
  const [bossSettings, setBossSettings] = useState<Record<string, number>>({});
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  useEffect(() => {
    async function loadBossSettings() {
      const { data } = await supabase.from('boss_settings').select('*');
      if (data) {
        const mapping: Record<string, number> = {};
        data.forEach(b => {
          mapping[b.boss_name] = b.score_multiplier;
        });
        setBossSettings(mapping);
      }
    }
    loadBossSettings();
  }, []);

  useEffect(() => {
    async function loadRaidLogs() {
      if (!startDate || !endDate) return;
      setIsLoadingLogs(true);
      
      const startIso = `${startDate}T00:00:00.000Z`;
      const endIso = `${endDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('boss_raid_logs')
        .select('*')
        .gte('raided_at', startIso)
        .lte('raided_at', endIso)
        .order('raided_at', { ascending: false });

      if (!error && data) {
        setRawRaidLogs(data);
      }
      setIsLoadingLogs(false);
    }
    if (subTab === 'boss') {
      loadRaidLogs();
    }
  }, [startDate, endDate, subTab]);

  const combatRanking = useMemo(() => {
    return [...members]
      .map(m => {
        const total = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
        return { ...m, totalScore: total };
      })
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.atk !== a.atk) return b.atk - a.atk; 
        return b.hit - a.hit;
      });
  }, [members]);

  const bossRanking = useMemo(() => {
    const rankingMap: Record<string, { character_name: string; guild_name: string; totalScore: number; bossCount: number; id: any }> = {};
    
    members.forEach(m => {
      rankingMap[m.character_name.trim()] = {
        id: m.id,
        character_name: m.character_name,
        guild_name: m.guild_name || '무소속',
        totalScore: 0,
        bossCount: 0
      };
    });

    rawRaidLogs.forEach(log => {
      const charName = log.character_name.trim();
      if (rankingMap[charName]) {
        const multiplier = bossSettings[log.boss_name] ?? 10;
        rankingMap[charName].totalScore += multiplier;
        rankingMap[charName].bossCount += 1;
      }
    });

    return Object.values(rankingMap).sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.bossCount - a.bossCount;
    });
  }, [members, rawRaidLogs, bossSettings]);

  const characterDetails = useMemo(() => {
    if (!selectedCharacter) return [];
    return rawRaidLogs.filter(log => log.character_name.trim() === selectedCharacter.trim());
  }, [selectedCharacter, rawRaidLogs]);

  const statsData = useMemo(() => {
    if (members.length === 0) {
      return { 
        classChartData: [], 
        guildChartData: [], 
        topCombatPower: null,
        topPerClass: [],
        topPerGuild: [],
        topBossRanks: []
      };
    }

    const classCount: Record<string, number> = {};
    const guildStats: Record<string, { total: number; count: number }> = {};
    
    const maxPerClass: Record<string, any> = {};
    const maxPerGuild: Record<string, any> = {};

    let topCombatPower: any | null = null;

    members.forEach(m => {
      const score = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
      const memberData = { ...m, totalScore: score };

      if (m.job_class) {
        classCount[m.job_class] = (classCount[m.job_class] || 0) + 1;
        if (!maxPerClass[m.job_class] || score > maxPerClass[m.job_class].totalScore) {
          maxPerClass[m.job_class] = memberData;
        }
      }

      const guildKey = m.guild_name || '무소속';
      if (m.guild_name) {
        if (!guildStats[guildKey]) guildStats[guildKey] = { total: 0, count: 0 };
        guildStats[guildKey].total += score;
        guildStats[guildKey].count += 1;
      }
      if (!maxPerGuild[guildKey] || score > maxPerGuild[guildKey].totalScore) {
        maxPerGuild[guildKey] = memberData;
      }

      if (!topCombatPower || score > topCombatPower.totalScore) {
        topCombatPower = memberData;
      }
    });

    const classChartData = Object.keys(classCount).map(name => ({
      name,
      value: classCount[name]
    }));

    const guildChartData = Object.keys(guildStats).map(name => ({
      name,
      '평균 전투력': Math.round(guildStats[name].total / guildStats[name].count)
    })).sort((a, b) => b['평균 전투력'] - a['평균 전투력']);

    const topPerClass = Object.values(maxPerClass);
    const topPerGuild = Object.values(maxPerGuild);

    const topBossRanks = bossRanking.slice(0, 3);

    return { 
      classChartData, 
      guildChartData, 
      topCombatPower,
      topPerClass,
      topPerGuild,
      topBossRanks
    };
  }, [members, bossRanking]);

  if (!isMounted) {
    return (
      <div className="bg-[#0b0f19]/90 backdrop-blur-2xl p-10 rounded-[32px] border border-slate-800/80 shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] space-y-8 animate-pulse min-h-[600px]" />
    );
  }

  return (
    <div className="bg-[#0b0f19]/90 backdrop-blur-2xl p-8 md:p-12 rounded-[32px] border border-slate-800/80 shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] space-y-10 text-slate-100 font-sans">
      
      {/* 타이틀 헤더 */}
      <div className="flex items-center gap-6 border-b border-slate-800/80 pb-8">
        <div className="p-4 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 shadow-inner">
          <Trophy className="text-violet-400 shrink-0 animate-pulse" size={48} />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-violet-300">연합 활동 랭킹 Portal</h2>
          <p className="text-sm text-slate-400 mt-3 font-medium">실시간 보스 세팅 데이터베이스와 연동하여 연합 대원들의 활동을 정밀 정산합니다.</p>
        </div>
      </div>

      {/* 대메뉴 탭 (플로팅 캡슐 스타일) */}
      <div className="flex bg-[#070a12] p-2.5 rounded-2xl border border-slate-800/80 shadow-inner gap-3">
        <button 
          onClick={() => setSubTab('combat')} 
          className={`flex-1 py-4 text-sm md:text-base font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer select-none
            ${subTab === 'combat' 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_10px_30px_-5px_rgba(109,40,217,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          <Swords size={22} /> 전투력 랭킹
        </button>
        <button 
          onClick={() => setSubTab('boss')} 
          className={`flex-1 py-4 text-sm md:text-base font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer select-none
            ${subTab === 'boss' 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_10px_30px_-5px_rgba(109,40,217,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          <CalendarDays size={22} /> 기간별 보스참여 랭킹
        </button>
        <button 
          onClick={() => setSubTab('stats')} 
          className={`flex-1 py-4 text-sm md:text-base font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer select-none
            ${subTab === 'stats' 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_10px_30px_-5px_rgba(109,40,217,0.4)]' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
        >
          <BarChart3 size={22} /> 시각화 통계
        </button>
      </div>

      <div className="pt-2">
        {/* TAB 1: 전투력 랭킹 */}
        {subTab === 'combat' && (
          <div className="space-y-5">
            <div className="text-xs tracking-wider text-slate-400 font-black uppercase flex justify-between px-6">
              <span>순위 및 대원 정보</span>
              <span>종합 전투력</span>
            </div>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {combatRanking.map((m, idx) => (
                <div 
                  key={m.id} 
                  className={`p-6 rounded-3xl border flex items-center justify-between transition-all duration-300 backdrop-blur-md
                    ${idx === 0 
                      ? 'bg-gradient-to-r from-amber-950/40 to-slate-900/40 border-amber-500/40 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]' 
                      : idx === 1 
                      ? 'bg-slate-900/60 border-slate-700/60' 
                      : idx === 2 
                      ? 'bg-slate-900/50 border-amber-900/30' 
                      : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700/80'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border
                      ${idx === 0 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : idx === 1 
                        ? 'bg-slate-700/30 border-slate-600/30 text-slate-300' 
                        : idx === 2 
                        ? 'bg-amber-900/30 border-amber-800/30 text-amber-600' 
                        : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                    >
                      {idx === 0 ? <Crown size={26} /> : idx === 1 ? <Award size={26} /> : idx === 2 ? <Award size={26} /> : <span>{idx + 1}</span>}
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-base flex items-center gap-3">
                        {m.character_name}
                        <span className="text-[10px] tracking-wider uppercase bg-slate-950 border border-slate-800 text-cyan-400 px-3 py-1 rounded-lg font-black">
                          {m.job_class}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-2 flex items-center gap-3">
                        <span>소속: <span className="text-slate-200 font-bold">{m.guild_name || '무소속'}</span></span>
                        <span className="text-slate-600">•</span>
                        <span>공격력 <span className="text-slate-200 font-bold">{m.atk}</span></span>
                        <span className="text-slate-600">•</span>
                        <span>방어력 <span className="text-slate-200 font-bold">{m.def}</span></span>
                        <span className="text-slate-600">•</span>
                        <span>명중 <span className="text-slate-200 font-bold">{m.hit}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-black text-2xl tracking-tight ${idx < 3 ? 'text-amber-400' : 'text-white'}`}>
                      {m.totalScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: 기간별 보스참여 랭킹 */}
        {subTab === 'boss' && (
          <div className="space-y-8">
            {/* 기간 설정 바 */}
            <div className="bg-[#070a12] p-6 rounded-2xl border border-slate-800/80 flex flex-wrap gap-6 items-center justify-between shadow-inner">
              <div className="flex items-center gap-3 text-sm text-slate-300 font-black tracking-tight">
                <Calendar size={22} className="text-violet-400" /><span>조회 기간 설정 :</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => { setStartDate(e.target.value); setSelectedCharacter(null); }} 
                  className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl text-sm font-bold text-white outline-none focus:border-violet-500 transition-all cursor-pointer" 
                />
                <span className="text-slate-600 font-bold">~</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => { setEndDate(e.target.value); setSelectedCharacter(null); }} 
                  className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-xl text-sm font-bold text-white outline-none focus:border-violet-500 transition-all cursor-pointer" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* 왼쪽 2개 칸: 기여도 랭킹 */}
              <div className="lg:col-span-2 space-y-4">
                <div className="text-xs tracking-wider text-slate-400 font-black uppercase flex justify-between px-6">
                  <span>대원 이름 / 연합 길드 (클릭 시 상세이력)</span>
                  <div className="flex gap-16 pr-6">
                    <span>참여 횟수</span><span>획득 점수</span>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {isLoadingLogs ? (
                    <div className="text-center text-slate-500 text-sm py-16 animate-pulse bg-[#070a12]/60 rounded-3xl border border-slate-800/80 font-bold">
                      Supabase 데이터 가공 및 연합 랭킹 집계 중...
                    </div>
                  ) : bossRanking.map((m, idx) => (
                    <div 
                      key={m.id || m.character_name} 
                      onClick={() => setSelectedCharacter(selectedCharacter === m.character_name ? null : m.character_name)}
                      className={`border p-6 rounded-[24px] flex items-center justify-between cursor-pointer transition-all duration-300 select-none backdrop-blur-sm
                        ${selectedCharacter === m.character_name 
                          ? 'bg-violet-950/20 border-violet-500/60 shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]' 
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80'}`}
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-slate-500 text-sm font-black w-6 text-center font-mono">{idx + 1}</span>
                        <div>
                          <span className="font-extrabold text-white text-base flex items-center gap-3 tracking-tight">
                            {m.character_name}
                            {selectedCharacter === m.character_name 
                              ? <ChevronUp size={18} className="text-violet-400" /> 
                              : <ChevronDown size={18} className="text-slate-500" />}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase font-black text-slate-400 bg-slate-950 border border-slate-800/80 px-3 py-1 rounded-lg mt-2 inline-block">
                            {m.guild_name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-12 text-right pr-2">
                        <span className="text-slate-300 font-mono text-xs w-16 text-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 font-bold">
                          {m.bossCount}회
                        </span>
                        <span className="text-emerald-400 font-mono font-black text-base min-w-[75px] text-right tracking-tight">
                          {m.totalScore.toLocaleString()} 점
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽 1개 칸: 상세 판넬 */}
              <div className="bg-[#070a12]/80 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-8 space-y-6 lg:sticky lg:top-8 shadow-2xl min-h-[400px]">
                <h3 className="text-sm font-black text-violet-400 flex items-center gap-3 border-b border-slate-800/80 pb-5 tracking-tight">
                  <Users size={20} /> 토벌 상세 로그 분석기
                </h3>
                
                {selectedCharacter ? (
                  <div className="space-y-5">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="text-[10px] tracking-wider uppercase text-slate-400 font-black">대상 대원</div>
                      <div className="text-base font-extrabold text-white mt-1.5 tracking-tight">{selectedCharacter}</div>
                    </div>
                    
                    <div className="text-xs font-black text-slate-400 flex items-center gap-2 tracking-tight">
                      <Clock size={16}/> 지정 기간 내 상세 타임라인 ({characterDetails.length}건)
                    </div>
                    
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 text-sm">
                      {characterDetails.map((log) => {
                        const score = bossSettings[log.boss_name] ?? 10;
                        return (
                          <div key={log.id} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center hover:border-slate-700/80 transition-all duration-200">
                            <div>
                              <p className="font-extrabold text-slate-200 text-sm tracking-tight">{log.boss_name}</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                {new Date(log.raided_at).toLocaleString('ko-KR')}
                              </p>
                            </div>
                            <span className="text-emerald-400 font-mono font-black bg-emerald-950/30 border border-emerald-900/40 px-3 py-1.5 rounded-xl text-xs tracking-tight">
                              +{score}점
                            </span>
                          </div>
                        );
                      })}
                      {characterDetails.length === 0 && (
                        <div className="text-xs text-slate-600 italic text-center py-12 font-medium">해당 기간 내 처치 참여 기록이 없습니다.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 font-mono font-black text-lg shadow-inner">
                      ?
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed tracking-tight">
                      좌측 랭킹 리스트에서 대원을 클릭하면<br />
                      상세 토벌 이력 날짜와 보스 내역이<br />
                      여기에 정밀 표기됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: 시각화 통계 */}
        {subTab === 'stats' && (
          <div key="stats-tab-container" className="space-y-10">
            {/* 1. 종합 최고 전투력 카드 */}
            <div className="bg-gradient-to-br from-violet-950/40 via-slate-900/40 to-slate-950/40 p-10 rounded-[32px] border border-violet-500/30 shadow-[0_0_40px_-10px_rgba(109,40,217,0.3)] flex items-center justify-between backdrop-blur-lg">
              <div>
                <div className="text-[10px] tracking-widest text-violet-400 font-black uppercase mb-2">👑 연합 최고 종합 전투력</div>
                <div className="text-4xl font-extrabold text-white tracking-tight">{statsData.topCombatPower?.character_name || '-'}</div>
                <div className="text-sm text-slate-400 mt-3 font-semibold">소속 길드 : <span className="text-slate-200 font-extrabold tracking-tight">{statsData.topCombatPower?.guild_name || '무소속'}</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-black uppercase tracking-wider">종합 점수</div>
                <div className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mt-2 tracking-tight">
                  {(statsData.topCombatPower?.totalScore || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* 2. 누적 보스 참여 TOP 3 & 직업/길드별 최고 전투력 카드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 보스 참여 TOP 3 */}
              <div className="bg-[#070a12] p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-xl backdrop-blur-sm">
                <h4 className="text-sm text-slate-200 font-black flex items-center gap-3 tracking-tight">🏆 누적 보스 참여 랭킹 TOP 3</h4>
                <div className="space-y-4 mt-6">
                  {statsData.topBossRanks.length > 0 ? (
                    statsData.topBossRanks.map((m: any, idx: number) => (
                      <div key={m.character_name} className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border font-mono
                            ${idx === 0 
                              ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' 
                              : idx === 1 
                              ? 'bg-slate-700/40 border-slate-600/40 text-slate-300' 
                              : 'bg-amber-900/30 border-amber-800/30 text-amber-600'}`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-white tracking-tight">{m.character_name}</div>
                            <div className="text-[10px] tracking-wider text-slate-400 mt-1.5 font-black uppercase">{m.guild_name}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs text-emerald-400 font-black tracking-tight">{m.totalScore.toLocaleString()}점</div>
                          <div className="text-[9px] text-slate-500 mt-2 tracking-tight">{m.bossCount}회 참여</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600 italic text-center py-12 font-medium">데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 직업별 최고 전투력 */}
              <div className="bg-[#070a12] p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-xl backdrop-blur-sm">
                <h4 className="text-sm text-slate-200 font-black flex items-center gap-3 tracking-tight">⚔️ 직업별 최고 전투력</h4>
                <div className="space-y-4 mt-6 max-h-[250px] overflow-y-auto pr-2">
                  {statsData.topPerClass.length > 0 ? (
                    statsData.topPerClass.map((m: any) => (
                      <div key={m.job_class} className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                        <div>
                          <div className="text-sm font-black text-cyan-400 tracking-tight">{m.job_class}</div>
                          <div className="text-xs text-slate-300 mt-2 font-extrabold tracking-tight">{m.character_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] tracking-wider uppercase text-slate-500 font-black">{m.guild_name}</div>
                          <div className="font-mono text-sm font-black text-white mt-2 tracking-tight">{m.totalScore.toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600 italic text-center py-12 font-medium">데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 길드별 최고 전투력 */}
              <div className="bg-[#070a12] p-8 rounded-3xl border border-slate-800/80 space-y-6 shadow-xl backdrop-blur-sm">
                <h4 className="text-sm text-slate-200 font-black flex items-center gap-3 tracking-tight">
                  <Shield size={18} className="text-amber-500" /> 길드별 최고 전투력
                </h4>
                <div className="space-y-4 mt-6 max-h-[250px] overflow-y-auto pr-2">
                  {statsData.topPerGuild.length > 0 ? (
                    statsData.topPerGuild.map((m: any) => (
                      <div key={m.guild_name} className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                        <div>
                          <div className="text-sm font-black text-amber-400 tracking-tight">{m.guild_name}</div>
                          <div className="text-xs text-slate-300 mt-2 font-extrabold tracking-tight">{m.character_name} ({m.job_class})</div>
                        </div>
                        <div className="font-mono text-sm font-black text-white tracking-tight">
                          {m.totalScore.toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600 italic text-center py-12 font-medium">등록된 길드 정보가 없습니다.</div>
                  )}
                </div>
              </div>

            </div>

            {/* 3. 시각화 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 차트 1: 직업 분포도 */}
              <div className="bg-[#070a12] p-8 rounded-[32px] border border-slate-800/80 space-y-6 shadow-xl backdrop-blur-sm">
                <h4 className="text-sm text-slate-200 font-black flex items-center gap-3 tracking-tight">📊 연합 내 직업 점유율 (인원수)</h4>
                <div className="w-full h-80 flex items-center justify-center">
                  {statsData.classChartData.length > 0 ? (
                    <ResponsiveContainer key="class-chart" width="100%" height="100%">
                      <PieChart>
                        <Pie data={statsData.classChartData} cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={5} dataKey="value">
                          {statsData.classChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '13px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px', fontWeight: 'bold' }} layout="horizontal" align="center" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm text-slate-600 italic">표시할 직업 데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 차트 2: 길드별 평균 전투력 */}
              <div className="bg-[#070a12] p-8 rounded-[32px] border border-slate-800/80 space-y-6 shadow-xl backdrop-blur-sm">
                <h4 className="text-sm text-slate-200 font-black flex items-center gap-3 tracking-tight">
                  <Shield size={18} className="text-violet-500" /> 길드별 평균 종합 전투력 비교
                </h4>
                <div className="w-full h-80 flex items-center justify-center pt-4">
                  {statsData.guildChartData.length > 0 ? (
                    <ResponsiveContainer key="guild-chart" width="100%" height="100%">
                      <BarChart data={statsData.guildChartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} fontWeight="bold" />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} fontWeight="bold" />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '13px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} 
                        />
                        <Bar dataKey="평균 전투력" radius={[12, 12, 0, 0]}>
                          {statsData.guildChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === statsData.guildChartData.length - 1 ? '#f59e0b' : '#8b5cf6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-sm text-slate-600 italic">등록된 길드 정보가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}