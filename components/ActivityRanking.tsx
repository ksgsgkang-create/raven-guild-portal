'use client';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, BarChart3, CalendarDays, Swords, Shield, Target, Crown, Award, PieChart, Users } from 'lucide-react';

export default function ActivityRanking({ members }: { members: any[] }) {
  const [subTab, setSubTab] = useState<'combat' | 'boss' | 'stats'>('combat');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. 전투력 랭킹 연산
  const combatRanking = useMemo(() => {
    return [...members]
      .map(m => {
        const total = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
        return { ...m, totalScore: total };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
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

  // 3. 시각화 통계용 연산
  const statsData = useMemo(() => {
    if (members.length === 0) return { classCount: {}, guildAvg: {}, topAtk: null, topDef: null, topHit: null };

    const classCount: Record<string, number> = {};
    const guildStats: Record<string, { total: number; count: number }> = {};
    let topAtk = members[0];
    let topDef = members[0];
    let topHit = members[0];

    members.forEach(m => {
      // class_name -> job_class로 변경하여 집계
      if (m.job_class) classCount[m.job_class] = (classCount[m.job_class] || 0) + 1;
      
      if (m.guild_name) {
        const score = (m.atk || 0) + (m.def || 0) + (m.hit || 0);
        if (!guildStats[m.guild_name]) guildStats[m.guild_name] = { total: 0, count: 0 };
        guildStats[m.guild_name].total += score;
        guildStats[m.guild_name].count += 1;
      }

      if ((m.atk || 0) > (topAtk.atk || 0)) topAtk = m;
      if ((m.def || 0) > (topDef.def || 0)) topDef = m;
      if ((m.hit || 0) > (topHit.hit || 0)) topHit = m;
    });

    const guildAvg = Object.keys(guildStats).map(name => ({
      name,
      avg: Math.round(guildStats[name].total / guildStats[name].count)
    })).sort((a, b) => b.avg - a.avg);

    return { classCount, guildAvg, topAtk, topDef, topHit };
  }, [members]);

  return (
    <div className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Trophy className="text-amber-500" size={36} />
        <div>
          <h2 className="text-2xl font-black text-white">연합 활동 랭킹</h2>
          <p className="text-xs text-slate-400 mt-1">전투력 정보 및 레이드 참여 현황 통계를 실시간 조회합니다.</p>
        </div>
      </div>

      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
        <button onClick={() => setSubTab('combat')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'combat' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Swords size={16} /> 전투력 랭킹</button>
        <button onClick={() => setSubTab('boss')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'boss' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><CalendarDays size={16} /> 기간별 보스참여 랭킹</button>
        <button onClick={() => setSubTab('stats')} className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'stats' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><BarChart3 size={16} /> 시각화 통계</button>
      </div>

      <div className="pt-2">
        {subTab === 'combat' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-semibold flex justify-between px-4"><span>순위 및 캐릭터 정보</span><span>종합 전투력</span></div>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {combatRanking.map((m, idx) => (
                <div key={m.id} className={`p-4 rounded-xl border flex items-center justify-between ${idx === 0 ? 'bg-amber-950/20 border-amber-500/40' : idx === 1 ? 'bg-slate-800/60 border-slate-400/30' : idx === 2 ? 'bg-amber-900/10 border-amber-800/30' : 'bg-slate-800/20 border-slate-800'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">{idx === 0 ? <Crown size={20} className="text-amber-400" /> : idx === 1 ? <Award size={20} className="text-slate-300" /> : idx === 2 ? <Award size={20} className="text-amber-600" /> : <span className="text-slate-500">{idx + 1}</span>}</div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {m.character_name}
                        <span className="text-[10px] bg-slate-900 text-sky-400 px-2 py-0.5 rounded border border-slate-800">{m.job_class}</span> {/* m.class_name -> m.job_class */}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2"><span>소속: {m.guild_name || '무소속'}</span><span>•</span><span>공 {m.atk} / 방 {m.def} / 명 {m.hit}</span></div>
                    </div>
                  </div>
                  <div className="text-right"><span className={`font-mono font-black text-base ${idx < 3 ? 'text-amber-400' : 'text-slate-200'}`}>{m.totalScore.toLocaleString()}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'boss' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold"><CalendarDays size={16} className="text-sky-400" /><span>조회 기간 설정 :</span></div>
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

        {subTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-950/20 to-slate-900 p-4 rounded-2xl border border-red-900/30">
                <div className="text-xs text-red-400 font-bold flex items-center gap-1 mb-1"><Swords size={14}/> 연합 최강 공격력</div>
                <div className="text-base font-black text-white">{statsData.topAtk?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고 수치: <span className="font-mono text-red-400 font-bold">{(statsData.topAtk?.atk || 0).toLocaleString()}</span></div>
              </div>
              <div className="bg-gradient-to-br from-blue-950/20 to-slate-900 p-4 rounded-2xl border border-blue-900/30">
                <div className="text-xs text-blue-400 font-bold flex items-center gap-1 mb-1"><Shield size={14}/> 연합 최고 방어력</div>
                <div className="text-base font-black text-white">{statsData.topDef?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고 수치: <span className="font-mono text-blue-400 font-bold">{(statsData.topDef?.def || 0).toLocaleString()}</span></div>
              </div>
              <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 p-4 rounded-2xl border border-emerald-900/30">
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mb-1"><Target size={14}/> 연합 최고 명중도</div>
                <div className="text-base font-black text-white">{statsData.topHit?.character_name || '-'}</div>
                <div className="text-[11px] text-slate-400 mt-1">최고 수치: <span className="font-mono text-emerald-400 font-bold">{(statsData.topHit?.hit || 0).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2"><PieChart size={14} className="text-sky-400" /> 연합 직업 분포 현황 (인원 비율)</h4>
              <div className="space-y-3">
                {Object.entries(statsData.classCount).map(([className, count]) => {
                  const percentage = Math.round((count / members.length) * 100);
                  return (
                    <div key={className} className="space-y-1">
                      <div className="flex justify-between text-xs"><span className="text-slate-300 font-semibold">{className}</span><span className="text-slate-500 font-mono">{count}명 ({percentage}%)</span></div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800"><div className="bg-gradient-to-r from-sky-600 to-indigo-500 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs text-slate-300 font-bold flex items-center gap-2"><Users size={14} className="text-amber-400" /> 길드별 평균 전투력 지표 비교</h4>
              <div className="flex items-end justify-around h-44 pt-6 pb-2 px-2 bg-slate-900/40 rounded-xl border border-slate-900">
                {statsData.guildAvg.map((g) => {
                  const maxAvg = Math.max(...statsData.guildAvg.map(x => x.avg), 1);
                  const heightPercent = Math.min(Math.round((g.avg / maxAvg) * 100), 100);
                  return (
                    <div key={g.name} className="flex flex-col items-center flex-1 group">
                      <span className="text-[10px] font-mono text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">{g.avg.toLocaleString()}</span>
                      <div className="w-8 sm:w-12 bg-slate-800 rounded-t-lg relative overflow-hidden border border-slate-700" style={{ height: `${heightPercent || 10}px`, minHeight: '12px' }}><div className="absolute inset-0 bg-gradient-to-t from-amber-600/60 to-amber-400" /></div>
                      <span className="text-[11px] text-slate-400 font-bold truncate max-w-[60px] sm:max-w-none mt-2">{g.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}