'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Home } from 'lucide-react';

export default function GuildManager({ guilds, onRefresh, showToast }: { guilds: any[], onRefresh: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [guildName, setGuildName] = useState('');

  async function handleAddGuild(e: React.FormEvent) {
    e.preventDefault();
    if (!guildName.trim()) {
      showToast('길드 이름을 입력해주세요.', 'error');
      return;
    }

    // 중복 검사 (g.name -> g.guild_name)
    const isExist = guilds.some(g => g.guild_name === guildName.trim());
    if (isExist) {
      showToast('이미 등록된 길드 이름입니다.', 'error');
      return;
    }

    // name: guildName -> guild_name: guildName
    const { error } = await supabase.from('alliance_guilds').insert([{ guild_name: guildName.trim() }]);
    if (error) {
      showToast('길드 추가 실패: ' + error.message, 'error');
    } else {
      setGuildName('');
      onRefresh();
      showToast('연합 길드가 성공적으로 추가되었습니다.');
    }
  }

  async function handleDeleteGuild(id: number, name: string) {
    if (!confirm(`"${name}" 길드를 정말 삭제하시겠습니까?\n(소속된 길드원이 있다면 먼저 확인해주세요)`)) return;

    const { error } = await supabase.from('alliance_guilds').delete().eq('id', id);
    if (error) {
      showToast('길드 삭제 실패: ' + error.message, 'error');
    } else {
      onRefresh();
      showToast(`"${name}" 길드가 연합에서 삭제되었습니다.`);
    }
  }

  return (
    <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
        <Shield className="text-sky-400" size={36} />
        <div>
          <h2 className="text-2xl font-black text-white">연합 길드 관리</h2>
          <p className="text-xs text-slate-400 mt-1">전국구 연합에 소속된 길드를 등록 및 관리합니다.</p>
        </div>
      </div>

      <form onSubmit={handleAddGuild} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/60 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs text-slate-400 font-bold mb-2">신규 길드 추가</label>
          <input 
            type="text" 
            value={guildName} 
            onChange={(e) => setGuildName(e.target.value)} 
            placeholder="추가할 길드명 입력" 
            className="w-full bg-slate-950 p-4 rounded-xl border border-slate-700 outline-none focus:border-sky-500 text-sm text-white"
          />
        </div>
        <button className="bg-sky-600 hover:bg-sky-500 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-pointer transition-all w-full md:w-auto">
          <Plus size={18} /> 길드 추가
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-400 text-sm border-b border-slate-800 pb-2">등록된 연합 길드 목록 ({guilds.length}개)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guilds.map((g, idx) => (
            <motion.div 
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-sky-950 p-2.5 rounded-xl border border-sky-800/60 text-sky-400">
                  <Home size={18} />
                </div>
                <div>
                  {/* g.name -> g.guild_name */}
                  <span className="font-bold text-white text-base">{g.guild_name}</span>
                  <div className="text-[10px] text-slate-500 mt-1">등록 고유번호: {g.id}</div>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteGuild(g.id, g.guild_name)}
                className="bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-300 p-3 rounded-xl cursor-pointer transition-all"
                title="길드 삭제"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
          {guilds.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-600 text-xs italic">
              등록된 연합 길드가 없습니다. 상단에서 추가해 보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}