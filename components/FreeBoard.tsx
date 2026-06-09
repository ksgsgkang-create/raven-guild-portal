'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../app/supabase';
import { MessageSquare, Send, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FreeBoard({ currentUser, showToast }: { currentUser: any, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, comments(*)')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  }

  async function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) {
      showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }
    await supabase.from('posts').insert([{ author_name: currentUser.character_name, title, content }]);
    setTitle(''); setContent(''); fetchPosts();
    showToast('게시글이 성공적으로 등록되었습니다.');
  }

  async function handleCommentSubmit(postId: number) {
    const commentContent = commentInputs[postId];
    if (!commentContent) return;

    await supabase.from('comments').insert([{
      post_id: postId,
      author_name: currentUser.character_name,
      content: commentContent
    }]);

    setCommentInputs({...commentInputs, [postId]: ''});
    fetchPosts();
    showToast('댓글이 등록되었습니다.');
  }

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div className="space-y-8 pb-20">
      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handlePostSubmit} 
        className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Send size={18} className="text-sky-400"/> 전령 보내기</h3>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="제목을 입력하세요" 
          className="w-full bg-slate-900 p-3 mb-3 rounded-xl border border-slate-700 focus:border-sky-500 outline-none transition-all" 
        />
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="내용을 작성하세요..." 
          className="w-full bg-slate-900 p-3 h-28 rounded-xl border border-slate-700 focus:border-sky-500 outline-none transition-all resize-none" 
        />
        <div className="flex justify-end mt-2">
          <button className="bg-sky-600 hover:bg-sky-500 px-8 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg shadow-sky-900/20">
            게시하기
          </button>
        </div>
      </motion.form>

      <div className="space-y-6">
        {posts.map((p, idx) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{p.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-sky-500"><User size={12}/> {p.author_name}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{p.content}</p>
            </div>

            <div className="bg-slate-950/50 p-6 border-t border-slate-800">
              <div className="space-y-4 mb-4">
                {p.comments && p.comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3 text-sm">
                    <div className="font-bold text-sky-500 min-w-[80px]">{c.author_name}</div>
                    <div className="text-slate-300">{c.content}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input 
                  value={commentInputs[p.id] || ''}
                  onChange={(e) => setCommentInputs({...commentInputs, [p.id]: e.target.value})}
                  placeholder="댓글을 남겨보세요..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-sky-500 transition-all"
                />
                <button 
                  onClick={() => handleCommentSubmit(p.id)}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg cursor-pointer transition-colors"
                >
                  <MessageSquare size={18} className="text-sky-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}