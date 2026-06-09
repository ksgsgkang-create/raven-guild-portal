'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase';
import { ShieldAlert, Plus, Trash2, Edit2, Check, X, Swords } from 'lucide-react';

export default function BossManager({ 
  isAdmin, 
  showToast 
}: { 
  isAdmin: any, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  const [bosses, setBosses] = useState<any[]>([]);
  const [newBossName, setNewBossName] = useState('');
  const [newBossScore, setNewBossScore] = useState<number>(10);
  const [editingBossName, setEditingBossName] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 보스 세팅 목록 가져오기
  async function fetchBossSettings() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('boss_settings')
      .select('*')
      .order('score_multiplier', { ascending: false });
    
    if (!error && data) {
      setBosses(data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      fetchBossSettings();
    }
  }, [isAdmin]);

  // 보스 신규 등록
  async function handleAddBoss(e: React.FormEvent) {
    e.preventDefault();
    if (!newBossName.trim()) {
      showToast('보스 이름을 입력해주세요.', 'error');
      return;
    }

    const { error } = await supabase
      .from('boss_settings')
      .insert([{ boss_name: newBossName.trim(), score_multiplier: Number(newBossScore) }]);

    if (error) {
      showToast('보스 등록 실패: ' + error.message, 'error');
    } else {
      setNewBossName('');
      setNewBossScore(10);
      fetchBossSettings();
      showToast('새로운 보스가 등록되었습니다.', 'success');
    }
  }

  // 보스 삭제
  async function handleDeleteBoss(bossName: string) {
    if (!confirm(`[${bossName}] 보스를 완전히 삭제하시겠습니까? 관련 레이드 로그 통계 점수에도 영향을 미칩니다.`)) return;

    const { error } = await supabase
      .from('boss_settings')
      .delete()
      .eq('boss_name', bossName);

    if (error) {
      showToast('보스 삭제 실패: ' + error.message, 'error');
    } else {
      fetchBossSettings();
      showToast('보스가 삭제되었습니다.', 'success');
    }
  }

  // 보스 점수 수정 저장
  async function handleSaveBossScore(bossName: string) {
    const { error } = await supabase
      .from('boss_settings')
      .update({ score_multiplier: Number(editScore) })
      .eq('boss_name', bossName);

    if (error) {
      showToast('점수 수정 실패: ' + error.message, 'error');
    } else {
      setEditingBossName(null);
      fetchBossSettings();
      showToast('보스 가중치 점수가 변경되었습니다.', 'success');
    }
  }

  // 비관리자 접근 방어
  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-400 font-bold flex items-center justify-center gap-2 bg-red-950/20 rounded-2xl border border-red-900/30">
        <ShieldAlert size={20} /> 최고 관리자 권한이 필요합니다.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Swords className="text-emerald-500" size={24} />
        <div>
          <h3 className="text-lg font-black text-white">🎯 레이드 대상 보스 및 참여 점수(가중치) 설정</h3>
          <p className="text-xs text-slate-400 mt-0.5">토벌 스캔 센터 연동 리스트에 등재될 보스와, 소속 길드원이 획득할 기여도 배점을 설정합니다.</p>
        </div>
      </div>

      {/* 보스 추가 등록 미니 폼 */}
      <form onSubmit={handleAddBoss} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs text-slate-400 font-bold mb-1">몬스터 이름</label>
          <input 
            type="text"
            value={newBossName}
            onChange={(e) => setNewBossName(e.target.value)}
            placeholder="예: 어비스4성"
            className="w-full bg-slate-900 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 font-bold mb-1">참여 기여도 포인트</label>
          <input 
            type="number"
            value={newBossScore || ''}
            onChange={(e) => setNewBossScore(Number(e.target.value))}
            placeholder="10"
            className="w-full bg-slate-900 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 text-sm text-white"
          />
        </div>
        <button type="submit" className="bg-emerald-700 hover:bg-emerald-600 text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-1 text-sm cursor-pointer transition-all h-[42px]">
          <Plus size={16} /> 보스 신규 등록
        </button>
      </form>

      {/* 실시간 등록 리스트 테이블 */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
        <div className="grid grid-cols-3 bg-slate-950 px-4 py-3 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div>보스 네임</div>
          <div className="text-center">배정 포인트 점수</div>
          <div className="text-right">데이터 핸들링</div>
        </div>
        
        <div className="divide-y divide-slate-800/60 max-h-[400px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-6 text-xs text-slate-500 animate-pulse">데이터를 불러오는 중입니다...</div>
          ) : (
            bosses.map((boss) => (
              <div key={boss.boss_name} className="grid grid-cols-3 px-4 py-3 items-center text-sm text-white hover:bg-slate-900/40 transition-colors">
                <div className="font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  {boss.boss_name}
                </div>
                
                <div className="text-center">
                  {editingBossName === boss.boss_name ? (
                    <input 
                      type="number"
                      value={editScore}
                      onChange={(e) => setEditScore(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs w-20 text-center text-emerald-400 font-bold outline-none"
                    />
                  ) : (
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-0.5 rounded">
                      {boss.score_multiplier} 점
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {editingBossName === boss.boss_name ? (
                    <>
                      <button onClick={() => handleSaveBossScore(boss.boss_name)} className="text-emerald-400 hover:bg-emerald-950/50 p-1.5 rounded-md border border-emerald-900/30 cursor-pointer"><Check size={14} /></button>
                      <button onClick={() => setEditingBossName(null)} className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-md border border-slate-700/50 cursor-pointer"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingBossName(boss.boss_name); setEditScore(boss.score_multiplier); }} className="text-sky-400 hover:bg-sky-950/30 p-1.5 rounded-md border border-sky-900/20 cursor-pointer"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteBoss(boss.boss_name)} className="text-red-400 hover:bg-red-950/30 p-1.5 rounded-md border border-red-900/20 cursor-pointer"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {!isLoading && bosses.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-600">설정된 보스가 비어있습니다. 위 양식을 통해 첫 번째 보스를 등록하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}