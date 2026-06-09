'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../app/supabase';
import { Trophy, CalendarDays, Swords, BarChart3, Crown, Award, Calendar, Shield, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';
// 고도화용 Recharts 차트 컴포넌트 임포트
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// 차트에 사용할 세련된 다크모드용 컬러 에셋
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#2dd4bf', '#e2e8f0'];

export default function ActivityRanking({ members }: { members: any[] }) {
  const [subTab, setSubTab] = useState<'combat' | 'boss' | 'stats'>('combat');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 기본 조회 기간을 이번 달 1일부터 오늘까지로 스마트 세팅
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // DB에서 실시간 긁어올 원본 로그와 보스 배점 세팅 상태
  const [rawRaidLogs, setRawRaidLogs] = useState<any[]>([]);
  const [bossSettings, setBossSettings] = useState<Record<string, number>>({});
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // 클릭하여 이력을 조회할 유저의 캐릭터명 선택 상태
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // 1. 초기 보스 배점 기준 세팅 로드
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

  // 2. 지정 기간이 변경될 때마다 Supabase에서 보스 레이드 로그 수집
  useEffect(() => {
    async function loadRaidLogs() {
      if (!startDate || !endDate) return;
      setIsLoadingLogs(true);
      
      // 날짜 필터링을 00:00:00 ~ 23:59:59 규격으로 포맷팅
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

  // 3. 전투력 랭킹 연산 (기존 로직 유지)
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

  // 4. 테이블 결합 기반 실시간 보스 참여 기여도 랭킹 연산
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

  // 5. 클릭된 유저의 지정 기간 내 상세 토벌 시간표 추출 데이터
  const characterDetails = useMemo(() => {
    if (!selectedCharacter) return [];
    return rawRaidLogs.filter(log => log.character_name.trim() === selectedCharacter.trim());
  }, [selectedCharacter, rawRaidLogs]);

  // 6. 통계 데이터 산출
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

    // 타입 에러 수정: 명시적으로 any | null 타입 지정
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
      <div className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 animate-pulse min-h-[400px]" />
    );
  }

  return (
    <div className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* 타이틀 헤더 */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Trophy className="text-amber-500" size={36} />
        <div>
          <h2 className="text-2xl font-black text-white">연합 활동 랭킹 Portal</h2>
          <p className="text-xs text-slate-400 mt-1">실시간 보스 세팅 데이터베이스와 매칭 연산하여 순위를 정산합니다.</p>
        </div>
      </div>

      {/* 대메뉴 탭 */}
      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
        <button onClick={() => setSubTab('combat')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${subTab === 'combat' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Swords size={16} /> 전투력 랭킹</button>
        <button onClick={() => setSubTab('boss')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${subTab === 'boss' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><CalendarDays size={16} /> 기간별 보스참여 랭킹</button>
        <button onClick={() => setSubTab('stats')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${subTab === 'stats' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><BarChart3 size={16} /> 시각화 통계</button>
      </div>

      <div className="pt-2">
        {/* TAB 1: 전투력 랭킹 */}
        {subTab === 'combat' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-semibold flex justify-between px-4"><span>순위 및 캐릭터 정보</span><span>종합 전투력</span></div>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {combatRanking.map((m, idx) => (
                <div key={m.id} className={`p-4 rounded-xl border flex items-center justify-between ${idx === 0 ? 'bg-amber-950/20 border-amber-500/40' : idx === 1 ? 'bg-slate-800/60 border-slate-400/30' : idx === 2 ? 'bg-amber-900/10 border-amber-800/30' : 'bg-slate-800/20 border-slate-800'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">{idx === 0 ? <Crown size={20} className="text-amber-400" /> : idx === 1 ? <Award size={20} className="text-slate-300" /> : idx === 2 ? <Award size={20} className="text-amber-600" /> : <span className="text-slate-500">{idx + 1}</span>}</div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">{m.character_name}<span className="text-[10px] bg-slate-900 text-sky-400 px-2 py-0.5 rounded border border-slate-800">{m.job_class}</span></div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2"><span>소속: {m.guild_name || '무소속'}</span><span>•</span><span>공 {m.atk} / 방 {m.def} / 명 {m.hit}</span></div>
                    </div>
                  </div>
                  <div className="text-right"><span className={`font-mono font-black text-base ${idx < 3 ? 'text-amber-400' : 'text-slate-200'}`}>{m.totalScore.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: 기간별 보스참여 랭킹 */}
        {subTab === 'boss' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold"><Calendar size={16} className="text-sky-400" /><span>조회 기간 설정 :</span></div>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setSelectedCharacter(null); }} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none focus:border-sky-500" />
                <span className="text-slate-500 text-xs">~</span>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setSelectedCharacter(null); }} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none focus:border-sky-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* 왼쪽 2개 칸: 기여도 랭킹 리스트 보드 */}
              <div className="lg:col-span-2 space-y-3">
                <div className="text-xs text-slate-400 font-semibold flex justify-between px-4">
                  <span>유저 이름 / 연합 길드 (클릭 시 상세이력 개방)</span>
                  <div className="flex gap-12 pr-4"><span>참여횟수</span><span>획득 점수</span></div>
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {isLoadingLogs ? (
                    <div className="text-center text-slate-500 text-xs py-8 animate-pulse">Supabase 데이터 가공 및 연합 랭킹 집계 중...</div>
                  ) : bossRanking.map((m, idx) => (
                    <div 
                      key={m.id || m.character_name} 
                      onClick={() => setSelectedCharacter(selectedCharacter === m.character_name ? null : m.character_name)}
                      className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-slate-800/40
                        ${selectedCharacter === m.character_name ? 'bg-sky-950/20 border-sky-500/60 shadow-md shadow-sky-900/10' : 'bg-slate-800/20 border-slate-800/60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500 text-xs font-bold w-5 text-center">{idx + 1}</span>
                        <div>
                          <span className="font-bold text-white text-sm flex items-center gap-2">
                            {m.character_name}
                            {selectedCharacter === m.character_name ? <ChevronUp size={14} className="text-sky-400" /> : <ChevronDown size={14} className="text-slate-500" />}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded mt-1 inline-block">{m.guild_name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-10 text-right pr-2">
                        <span className="text-slate-300 font-mono text-xs w-12 text-center bg-slate-950 px-2 py-1 rounded border border-slate-800">{m.bossCount}회</span>
                        <span className="text-emerald-400 font-mono font-black text-sm min-w-[60px] text-right">{m.totalScore.toLocaleString()} 점</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽 1개 칸: 클릭한 유저의 기간별 타임라인 상세 판넬 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 lg:sticky lg:top-4 min-h-[300px]">
                <h3 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-3">
                  <Users size={14} /> 토벌 상세 로그 분석기
                </h3>
                
                {selectedCharacter ? (
                  <div className="space-y-3">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-bold">대상 대원</div>
                      <div className="text-sm font-black text-white mt-0.5">{selectedCharacter}</div>
                    </div>
                    
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1"><Clock size={12}/> 지정 기간 내 상세 타임라인 ({characterDetails.length}건)</div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-xs">
                      {characterDetails.map((log) => {
                        const score = bossSettings[log.boss_name] ?? 10;
                        return (
                          <div key={log.id} className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center hover:border-slate-700">
                            <div>
                              <p className="font-bold text-slate-200">{log.boss_name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(log.raided_at).toLocaleDateString('ko-KR')}</p>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded text-[10px]">
                              +{score}점
                            </span>
                          </div>
                        );
                      })}
                      {characterDetails.length === 0 && (
                        <div className="text-center text-slate-600 italic py-8 text-[11px]">해당 기간 내 처치 참여 기록이 없습니다.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500 mb-2 font-mono font-bold">?</div>
                    <p className="text-xs text-slate-500 font-medium">좌측 랭킹 리스트에서<br />길드원을 클릭하면 상세 토벌 이력 날짜와 보스 내역이 여기에 정밀 표기됩니다.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: 시각화 통계 */}
        {subTab === 'stats' && (
          <div className="space-y-8">
            {/* 1. 종합 최고 전투력 카드 */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-6 rounded-2xl border border-amber-500/30 shadow-md flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mb-1">👑 연합 최고 종합 전투력</div>
                <div className="text-2xl font-black text-white">{statsData.topCombatPower?.character_name || '-'}</div>
                <div className="text-xs text-slate-400 mt-1">소속 길드 : <span className="text-slate-200 font-bold">{statsData.topCombatPower?.guild_name || '무소속'}</span></div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500">종합 점수</div>
                <div className="text-3xl font-mono font-black text-amber-400 mt-0.5">
                  {(statsData.topCombatPower?.totalScore || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* 2. 누적 보스 참여 랭킹 TOP 3 & 직업/길드별 최고 전투력 카드 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 보스 참여 TOP 3 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2">🏆 누적 보스 참여 랭킹 TOP 3</h4>
                <div className="space-y-3 mt-4">
                  {statsData.topBossRanks.length > 0 ? (
                    statsData.topBossRanks.map((m: any, idx: number) => (
                      <div key={m.character_name} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : idx === 1 ? 'bg-slate-700 text-slate-300' : 'bg-amber-800/30 text-amber-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{m.character_name}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{m.guild_name}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-[10px] text-emerald-400 font-black">{m.totalScore.toLocaleString()}점</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{m.bossCount}회 참여</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 italic text-center py-6">데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 직업별 최고 전투력 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2">⚔️ 직업별 최고 전투력</h4>
                <div className="space-y-3 mt-4 max-h-[175px] overflow-y-auto pr-1">
                  {statsData.topPerClass.length > 0 ? (
                    statsData.topPerClass.map((m: any) => (
                      <div key={m.job_class} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                        <div>
                          <div className="text-xs font-black text-sky-400">{m.job_class}</div>
                          <div className="text-[10px] text-slate-300 mt-0.5 font-bold">{m.character_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">{m.guild_name}</div>
                          <div className="font-mono text-xs font-black text-slate-200 mt-0.5">{m.totalScore.toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 italic text-center py-6">데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 길드별 최고 전투력 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2"><Shield size={14} className="text-amber-500" /> 길드별 최고 전투력</h4>
                <div className="space-y-3 mt-4 max-h-[175px] overflow-y-auto pr-1">
                  {statsData.topPerGuild.length > 0 ? (
                    statsData.topPerGuild.map((m: any) => (
                      <div key={m.guild_name} className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
                        <div>
                          <div className="text-xs font-black text-amber-400">{m.guild_name}</div>
                          <div className="text-[10px] text-slate-300 mt-0.5 font-bold">{m.character_name} ({m.job_class})</div>
                        </div>
                        <div className="text-right font-mono text-xs font-black text-slate-200">
                          {m.totalScore.toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-600 italic text-center py-6">등록된 길드 정보가 없습니다.</div>
                  )}
                </div>
              </div>

            </div>

            {/* 3. 시각화 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 차트 1: 고급 도넛 형태 직업 분포도 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2">📊 연합 내 직업 점유율 (인원수)</h4>
                <div className="w-full h-64 flex items-center justify-center">
                  {statsData.classChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statsData.classChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                          {statsData.classChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} layout="horizontal" align="center" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-600 italic">표시할 직업 데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 차트 2: 길드별 평균 종합 전투력 비교 차트 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2"><Shield size={14} className="text-amber-500" /> 길드별 평균 종합 전투력 비교</h4>
                <div className="w-full h-64 flex items-center justify-center">
                  {statsData.guildChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData.guildChartData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Bar dataKey="평균 전투력" radius={[6, 6, 0, 0]}>
                          {statsData.guildChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === statsData.guildChartData.length - 1 ? '#fbbf24' : '#0ea5e9'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-600 italic">등록된 길드 정보가 없습니다.</div>
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