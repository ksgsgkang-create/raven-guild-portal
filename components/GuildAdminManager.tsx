'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../app/supabase';
import { ShieldAlert, Plus, Trash2, Edit2, Check, X, Swords, Users, Shield, Megaphone } from 'lucide-react';

export default function GuildAdminManager({ 
  guilds, 
  allUsers, 
  isAdmin, 
  onRefresh, 
  showToast 
}: { 
  guilds: any[], 
  allUsers: any[], 
  isAdmin: any, 
  onRefresh: () => void, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  // 기존 기능용 상태 관리
  const [newGuild, setNewGuild] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // 신규 추가된 보스 관리용 상태 관리
  const [bosses, setBosses] = useState<any[]>([]);
  const [newBossName, setNewBossName] = useState('');
  const [newBossScore, setNewBossScore] = useState<number>(10);
  const [editingBossName, setEditingBossName] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(10);

  // 초기 로드 시 Supabase에서 보스 세팅 목록 가져오기
  async function fetchBossSettings() {
    const { data, error } = await supabase
      .from('boss_settings')
      .select('*')
      .order('score_multiplier', { ascending: false });
    
    if (!error && data) {
      setBosses(data);
    }
  }

  useEffect(() => {
    fetchBossSettings();
  }, []);

  // [기존기능] 길드 추가
  async function handleAddGuild(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuild.trim()) return;
    const { error } = await supabase.from('alliance_guilds').insert([{ guild_name: newGuild.trim() }]);
    if (error) {
      showToast('길드 추가 실패: ' + error.message, 'error');
    } else {
      setNewGuild('');
      onRefresh();
      showToast('새로운 연합 길드가 추가되었습니다.', 'success');
    }
  }

  // [기존기능] 승인/거절 처리
  async function handleUserAction(characterName: string, action: 'approve' | 'reject') {
    if (action === 'approve') {
      const { error } = await supabase.from('user_accounts').update({ is_approved: true }).eq('character_name', characterName);
      if (error) showToast('승인 처리 실패: ' + error.message, 'error');
      else showToast('가입을 승인했습니다.', 'success');
    } else {
      if (!confirm('정말 가입을 거절(삭제)하시겠습니까?')) return;
      const { error } = await supabase.from('user_accounts').delete().eq('character_name', characterName);
      if (error) showToast('거절 처리 실패: ' + error.message, 'error');
      else showToast('가입 신청을 거절했습니다.', 'success');
    }
    onRefresh();
  }

  // [기존기능] 공지사항 등록
  async function handlePostNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    
    const { error } = await supabase.from('notices').insert([{ title: noticeTitle.trim(), content: noticeContent.trim() }]);
    
    if (error) {
      showToast('공지 게시 실패: ' + error.message, 'error');
    } else {
      setNoticeTitle('');
      setNoticeContent('');
      showToast('공지 등록 완료!', 'success');
      onRefresh();
    }
  }

  // [신규기능] 보스 추가 등록
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

  // [신규기능] 보스 삭제
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

  // [신규기능] 보스 점수 수정 저장
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
    <div className="space-y-8">
      
      {/* 1. 웹 가입 승인 관리 판넬 */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-red-400 text-base flex items-center gap-2">
          <Users size={18} /> ⚙️ 웹 가입 승인 대기 명단
        </h3>
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {allUsers.filter(u => !u.is_approved).map(u => (
            <div key={u.character_name} className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
              <span className="font-bold text-white text-sm">{u.character_name}</span>
              <div className="space-x-2">
                <button onClick={() => handleUserAction(u.character_name, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all">승인</button>
                <button onClick={() => handleUserAction(u.character_name, 'reject')} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all">거절</button>
              </div>
            </div>
          ))}
          {allUsers.filter(u => !u.is_approved).length === 0 && (
            <div className="text-slate-500 text-xs italic py-2">현재 대기 중인 신규 가입 신청자가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 2. 길드 관리 및 공지사항 작성 분할 레이아웃 구역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 길드 관리 컴포넌트 */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-sky-400 text-base flex items-center gap-2">
            <Shield size={18} /> 🏰 연합 소속 길드 관리
          </h3>
          <form onSubmit={handleAddGuild} className="flex gap-2">
            <input 
              value={newGuild} 
              onChange={(e) => setNewGuild(e.target.value)} 
              className="flex-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-sky-500" 
              placeholder="새 길드명 입력" 
            />
            <button className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all flex items-center gap-1">
              <Plus size={16} /> 추가
            </button>
          </form>
          <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {guilds.map(g => (
              <div key={g.id} className="bg-slate-950/40 p-2.5 rounded-xl text-center border border-slate-800 text-xs text-slate-300 font-medium">
                🛡️ {g.guild_name}
              </div>
            ))}
          </div>
        </div>

        {/* 공지사항 작성 컴포넌트 */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-amber-400 text-base flex items-center gap-2">
            <Megaphone size={18} /> 📢 연합 공지사항 게시판 관리
          </h3>
          <form onSubmit={handlePostNotice} className="space-y-2">
            <input 
              value={noticeTitle} 
              onChange={(e) => setNoticeTitle(e.target.value)} 
              placeholder="공지 제목을 입력하세요." 
              className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500" 
            />
            <textarea 
              value={noticeContent} 
              onChange={(e) => setNoticeContent(e.target.value)} 
              placeholder="공지 상세 내용을 작성하세요." 
              className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-sm text-white outline-none focus:border-amber-500 h-20 resize-none" 
            />
            <button className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all">
              시스템 전체 공지 게시
            </button>
          </form>
        </div>
      </div>

      {/* 3. [통합 연동] 레이드 보스 및 기여도 가중치 점수 셋업 섹션 */}
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
          
          <div className="divide-y divide-slate-800/60 max-h-[260px] overflow-y-auto pr-1">
            {bosses.map((boss) => (
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
            ))}
            {bosses.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-600">설정된 보스가 비어있습니다. 위 양식을 통해 첫 번째 보스를 등록하세요.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}