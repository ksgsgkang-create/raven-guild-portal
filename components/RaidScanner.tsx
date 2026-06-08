'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase';

interface RaidScannerProps {
  members: any[];
  onRefresh: () => void;
}

export default function RaidScanner({ members, onRefresh }: RaidScannerProps) {
  const [bossType, setBossType] = useState('본토보스(4성)');
  const [raidDate, setRaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [matchedMembers, setMatchedMembers] = useState<string[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [raidDate, bossType]);

  async function fetchHistory() {
    const { data: raid } = await supabase
      .from('boss_raids')
      .select('*')
      .eq('raid_date', raidDate)
      .eq('boss_type', bossType)
      .maybeSingle();

    if (raid) {
      const { data: participants } = await supabase
        .from('raid_participants')
        .select('member_name')
        .eq('raid_id', raid.id);
      setHistory([{ ...raid, raid_participants: participants || [] }]);
    } else {
      setHistory([]);
    }
  }

  async function handleOcrAnalyze() {
    if (!imageFile) return alert('이미지를 선택하세요!');
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        const result = await response.json();
        const extractedText = (result.text || '').replace(/\s+/g, '');
        const found = members.filter(m => extractedText.includes(m.character_name.trim())).map(m => m.character_name.trim());
        setMatchedMembers(Array.from(new Set(found)));
        setOcrLoading(false);
      };
    } catch (e) {
      alert('스캔 실패');
      setOcrLoading(false);
    }
  }

  async function handleSaveRaidRecord() {
    if (history.length > 0) return alert('이미 기록된 보스입니다!');
    const { data: rData } = await supabase.from('boss_raids').insert([{ boss_type: bossType, raid_date: raidDate }]).select().single();
    await supabase.from('raid_participants').insert(matchedMembers.map(name => ({ raid_id: rData.id, member_name: name })));
    alert('저장 완료!');
    setMatchedMembers([]);
    onRefresh();
    fetchHistory();
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-sky-400">토벌 스캔 센터</h2>
          {history.length > 0 ? (
            <span className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-800 rounded-full text-xs font-bold">🔒 기록 완료</span>
          ) : (
            <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold">✨ 신규 스캔 가능</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select value={bossType} onChange={(e) => setBossType(e.target.value)} className="bg-slate-900 border border-slate-600 p-3 rounded-xl cursor-pointer">
            <option>본토보스(4성)</option><option>본토보스(5성)</option><option>어비스보스</option>
          </select>
          <input type="date" value={raidDate} onChange={(e) => setRaidDate(e.target.value)} className="bg-slate-900 border border-slate-600 p-3 rounded-xl" />
        </div>
        <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-400 p-2" />
        <button onClick={handleOcrAnalyze} className="w-full mt-4 bg-sky-600 py-3 rounded-xl font-bold hover:bg-sky-500 transition-all">{ocrLoading ? '분석 중...' : '스캔 시작'}</button>
      </div>

      {matchedMembers.length > 0 && (
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-sky-500">
          <h3 className="font-bold text-sky-300 mb-4">🎯 스캔된 인원 ({matchedMembers.length}명)</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {matchedMembers.map((m, i) => <span key={i} className="bg-sky-950 px-3 py-1 rounded-lg text-sm text-sky-200 border border-sky-800">{m}</span>)}
          </div>
          <button onClick={handleSaveRaidRecord} className="w-full bg-amber-600 py-2 rounded-lg font-bold">결과 저장하기</button>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-slate-300 mb-4">📊 {raidDate} 참여 현황</h3>
        {history.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {history[0].raid_participants.map((p: any, i: number) => (
              <span key={i} className="bg-slate-900 px-3 py-2 rounded-lg text-sm text-amber-200 border border-slate-700">{p.member_name}</span>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 italic">기록 없음</div>
        )}
      </div>
    </div>
  );
}