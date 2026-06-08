'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../app/supabase';

export default function NoticeBoardList() {
  const [notices, setNotices] = useState<any[]>([]);

  async function fetchNotices() {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setNotices(data);
    else if (error) console.error("공지사항 로드 에러:", error);
  }

  useEffect(() => {
    fetchNotices();
  }, []);

  return (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h3 className="font-bold text-amber-400 mb-4 text-lg">📢 공지사항</h3>
      {notices.length === 0 ? (
        <p className="text-sm text-slate-500 italic">등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div key={n.id} className="border-b border-slate-700 pb-3 last:border-0">
              <h4 className="font-bold text-white text-sm">{n.title}</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.content}</p>
              <div className="text-[10px] text-slate-600 mt-2">
                {new Date(n.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}