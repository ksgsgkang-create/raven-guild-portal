import { createClient } from '@supabase/supabase-js';

// 아까 .env.local 파일에 적어둔 주소와 비밀키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 수파베이스와 통신할 메신저(client)를 생성하여 밖으로 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);