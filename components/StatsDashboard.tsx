'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../app/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function StatsDashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [renderKey, setRenderKey] = useState(0); // 강제 렌더링을 위한 키 값

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from('raid_participants').select('member_name');
      if (data) {
        const countMap: any = {};
        data.forEach(p => countMap[p.member_name] = (countMap[p.member_name] || 0) + 1);
        const formatted = Object.keys(countMap)
          .map(name => ({ name, count: countMap[name] }))
          .sort((a, b) => b.count - a.count);
        setStats(formatted);
      }
    }
    fetchStats();
    
    // 탭이 바뀔 때 컨테이너가 다시 인식되도록 지연 실행
    const timer = setTimeout(() => setRenderKey(prev => prev + 1), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div key={renderKey} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl">
      <h2 className="text-xl font-bold text-amber-400 mb-6">🛡️ 길드원 전체 참여 통계</h2>
      
      {/* 스타일을 인라인으로 강제하여 높이를 확보합니다 */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              cursor={{ fill: '#1e293b' }}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} 
            />
            <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-center">
            <div className="text-xs text-slate-400 truncate">{s.name}</div>
            <div className="text-lg font-bold text-sky-400">{s.count}회</div>
          </div>
        ))}
      </div>
    </div>
  );
}