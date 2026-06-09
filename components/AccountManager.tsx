'use client';
import React from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { ShieldAlert, UserX, UserCheck, Key, RefreshCw } from 'lucide-react';

export default function AccountManager({ 
  allUsers, 
  onRefresh, 
  showToast 
}: { 
  allUsers: any[], 
  onRefresh: () => void, 
  showToast: (message: string, type?: 'error' | 'success') => void 
}) {
  
  // 계정 삭제 핸들러
  async function handleAccountDelete(characterName: string) {
    if (!confirm(`정말 "${characterName}" 님의 계정을 탈퇴(삭제)시키겠습니까?`)) return;

    const { error } = await supabase.from('user_accounts').delete().eq('character_name', characterName);
    
    if (error) {
      showToast('계정 삭제 실패: ' + error.message, 'error');
    } else {
      showToast(`"${characterName}" 님 계정이 삭제(탈퇴)되었습니다.`);
      onRefresh();
    }
  }

  // 권한 변경(토글) 핸들러 추가
  async function handleToggleAdmin(characterName: string, currentIsAdmin: boolean) {
    const newAdminStatus = !currentIsAdmin;
    const confirmMsg = newAdminStatus 
      ? `"${characterName}" 님을 관리자 권한으로 승급시키겠습니까?` 
      : `"${characterName}" 님을 일반 길드원으로 변경(권한 해제)하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from('user_accounts')
      .update({ is_admin: newAdminStatus })
      .eq('character_name', characterName);
    
    if (error) {
      showToast('권한 변경 실패: ' + error.message, 'error');
    } else {
      showToast(`"${characterName}" 님의 권한이 성공적으로 변경되었습니다.`);
      onRefresh();
    }
  }

  return (
    <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <ShieldAlert className="text-sky-400" size={36} />
        <div>
          <h2 className="text-2xl font-black text-white">가입 계정 관리</h2>
          <p className="text-xs text-slate-400 mt-1">포탈에 가입된 전체 계정 정보를 조회 및 관리합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allUsers.map((u, idx) => (
          <motion.div 
            key={u.character_name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{u.character_name}</span>
                {u.is_admin ? (
                  <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-1">
                    <Key size={10} /> 관리자
                  </span>
                ) : (
                  <span className="bg-slate-950 text-slate-400 text-[9px] px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                    <UserCheck size={10} /> 길드원
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-3">
                <span>가입일: {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 권한 변경 버튼 추가 */}
              <button
                onClick={() => handleToggleAdmin(u.character_name, u.is_admin)}
                title={u.is_admin ? '일반 길드원으로 강등' : '관리자로 승급'}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-3 rounded-xl cursor-pointer transition-all flex items-center justify-center"
              >
                <RefreshCw size={16} />
              </button>

              <button 
                onClick={() => handleAccountDelete(u.character_name)}
                className="bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 p-3 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
              >
                <UserX size={16} /> 강제 탈퇴
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}