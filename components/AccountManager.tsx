'use client';
import React from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { ShieldAlert, UserX, UserCheck, Key } from 'lucide-react';

export default function AccountManager({ allUsers, onRefresh, showToast }: { allUsers: any[], onRefresh: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  
  // id 대신 characterName을 직접 받아 삭제하도록 수정
  async function handleAccountDelete(characterName: string) {
    if (!confirm(`정말 "${characterName}" 님의 계정을 탈퇴(삭제)시키겠습니까?`)) return;

    // 기본키인 character_name을 기준으로 삭제
    const { error } = await supabase.from('user_accounts').delete().eq('character_name', characterName);
    
    if (error) {
      showToast('계정 삭제 실패: ' + error.message, 'error');
    } else {
      showToast(`"${characterName}" 님 계정이 삭제(탈퇴)되었습니다.`);
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
            key={u.character_name} // 고유값인 캐릭터명을 key로 사용
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

            <button 
              onClick={() => handleAccountDelete(u.character_name)} // 캐릭터명 전달
              className="bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 p-3 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <UserX size={16} /> 강제 탈퇴
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}