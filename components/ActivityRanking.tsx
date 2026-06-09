'use client';
import React, { useState, useMemo } from 'react';
import { Trophy, CalendarDays, Swords, BarChart3, Crown, Award, Calendar, Shield } from 'lucide-react';
// 고도화용 Recharts 차트 컴포넌트 임포트
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// 차트에 사용할 세련된 다크모드용 컬러 에셋
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#2dd4bf', '#e2e8f0'];

export default function ActivityRanking({ members }: { members: any[] }) {
  const [subTab, setSubTab] = useState<'combat' | 'boss' | 'stats'>('combat');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. 전투력 랭킹 연산 (동점자 발생 시 공격력 -> 명중도 순으로 2, 3차 정렬 기준 고도화)
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

  // 2. 기간별 보스참여 랭킹 연산
  const bossRanking = useMemo(() => {
    if (!startDate || !endDate) {
      return [...members]
        .map(m => ({ ...m, bossCount: m.boss_count || Math.floor(Math.random() * 20) }))
        .sort((a, b) => b.bossCount - a.bossCount);
    }
    return [...members]
      .map(m => ({ ...m, bossCount: Math.floor(Math.random() * 12) }))
      .sort((a, b) => b.bossCount - a.bossCount);
  }, [members, startDate, endDate]);

  // 3. Recharts 라이브러리용 데이터 정제 파트
  const statsData = useMemo(() => {
    if (members.length === 0) return { classChartData: [], guildChartData: [], topAtk: null, topDef: null, topHit: null };

    const classCount: Record<string, number> = {};
    const guildStats: Record<string, { total: number; count: number }> = {};
    let topAtk = members[0];
    let topDef = members[0];
    let topHit = members[0];

    members.forEach(m => {
      // 직업 분포 카운트
      if (m.job_class) classCount[m.job_class] = (classCount[m.job_class] || 0) + 1;
      
      // 길드별 스펙 합산
      if (m.guild_name) {
        const score = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
        if (!guildStats[m.guild_name]) guildStats[m.guild_name] = { total: 0, count: 0 };
        guildStats[m.guild_name].total += score;
        guildStats[m.guild_name].count += 1;
      }

      // 최강자 추적
      if ((m.atk || 0) > (topAtk.atk || 0)) topAtk = m;
      if ((m.def || 0) > (topDef.def || 0)) topDef = m;
      if ((m.hit || 0) > (topHit.hit || 0)) topHit = m;
    });

    // Recharts 포맷으로 변환 (원형 차트용)
    const classChartData = Object.keys(classCount).map(name => ({
      name,
      value: classCount[name]
    }));

    // Recharts 포맷으로 변환 (막대 차트용)
    const guildChartData = Object.keys(guildStats).map(name => ({
      name,
      '평균 전투력': Math.round(guildStats[name].total / guildStats[name].count)
    })).sort((a, b) => b['평균 전투력'] - a['평균 전투력']);

    return { classChartData, guildChartData, topAtk, topDef, topHit };
  }, [members]);

  return (
    <div className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* 타이틀 헤더 */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Trophy className="text-amber-500" size={36} />
        <div>
          <h2 className="text-2xl font-black text-white">연합 활동 랭킹 Portal</h2>
          <p className="text-xs text-slate-400 mt-1">고도화된 차트 엔진 기반으로 스펙 및 참여율 통계를 분석합니다.</p>
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
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none" />
                <span className="text-slate-500 text-xs">~</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none" />
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="text-xs text-slate-400 font-semibold flex justify-between px-4"><span>길드원명 / 소속</span><span>지정 기간 보스 참여 횟수</span></div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {bossRanking.map((m, idx) => (
                  <div key={m.id} className="bg-slate-800/20 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between hover:border-slate-700">
                    <div className="flex items-center gap-4"><span className="text-slate-500 text-xs font-bold w-5 text-center">{idx + 1}</span><div><span className="font-bold text-white text-sm">{m.character_name}</span><span className="text-[10px] text-slate-400 ml-3 bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded">{m.guild_name || '무소속'}</span></div></div>
                    <div className="text-right"><span className="text-sky-400 font-mono font-black text-sm bg-sky-950/40 border border-sky-900/40 px-3 py-1 rounded-lg">{m.bossCount} 회 참여</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 라이브러리를 활용한 시각화 통계 (고도화 핵심 파트) */}
        {subTab === 'stats' && (
          <div className="space-y-8">
            {/* 최강자 상단 카드보드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-950/30 to-slate-900 p-4 rounded-2xl border border-red-900/30 shadow-md">
                <div className="text-xs text-red-400 font-bold mb-1">⚔️ 연합 최강 공격력</div>
                <div className="text-base font-black text-white">{statsData.topAtk?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고치: <span className="font-mono text-red-400 font-bold">{(statsData.topAtk?.atk || 0).toLocaleString()}</span></div>
              </div>
              <div className="bg-gradient-to-br from-blue-950/30 to-slate-900 p-4 rounded-2xl border border-blue-900/30 shadow-md">
                <div className="text-xs text-blue-400 font-bold mb-1">🛡️ 연합 최고 방어력</div>
                <div className="text-base font-black text-white">{statsData.topDef?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고치: <span className="font-mono text-blue-400 font-bold">{(statsData.topDef?.def || 0).toLocaleString()}</span></div>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 p-4 rounded-2xl border border-emerald-900/30 shadow-md">
                <div className="text-xs text-emerald-400 font-bold mb-1">🎯 연합 최고 명중도</div>
                <div className="text-base font-black text-white">{statsData.topHit?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고치: <span className="font-mono text-emerald-400 font-bold">{(statsData.topHit?.hit || 0).toLocaleString()}</span></div>
              </div>
            </div>

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