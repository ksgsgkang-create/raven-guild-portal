'use client';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star } from 'lucide-react';

export default function ActivityRanking({ members }: { members: any[] }) {
  const sortedMembers = [...members].sort((a, b) => (b.participation_count || 0) - (a.participation_count || 0));

  return (
    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Trophy size={200} />
      </div>
      
      <div className="flex items-center gap-3 mb-8">
        <Crown className="text-yellow-500" size={32} />
        <h2 className="text-3xl font-black text-white">활동 명예의 전당</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedMembers.slice(0, 10).map((m, idx) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-6 p-5 rounded-2xl border transition-all ${
              idx === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-slate-800 border-yellow-600/50 shadow-lg shadow-yellow-900/20' :
              idx === 1 ? 'bg-gradient-to-r from-slate-300/10 to-slate-800 border-slate-400/30' :
              idx === 2 ? 'bg-gradient-to-r from-orange-900/20 to-slate-800 border-orange-800/30' :
              'bg-slate-800/40 border-slate-700'
            }`}
          >
            <div className="flex justify-center items-center w-12 h-12 rounded-full bg-slate-950 font-black text-xl shadow-inner">
              {idx === 0 ? <Crown className="text-yellow-400" /> : 
               idx === 1 ? <Medal className="text-slate-300" /> :
               idx === 2 ? <Medal className="text-orange-500" /> : 
               <span className="text-slate-500">{idx + 1}</span>}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${idx === 0 ? 'text-yellow-100' : 'text-white'}`}>{m.character_name}</span>
                {idx === 0 && <span className="bg-yellow-600 text-[10px] px-2 py-0.5 rounded text-white font-bold animate-pulse">MVP</span>}
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((m.participation_count || 0) * 10, 100)}%` }}
                  className={`h-full ${idx === 0 ? 'bg-yellow-500' : 'bg-sky-500'}`}
                />
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-white">{m.participation_count || 0}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Points</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}