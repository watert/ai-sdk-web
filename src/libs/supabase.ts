import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const url = import.meta.env.VITE_SUPABASE_URL || '';
const pubkey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const supabase = createClient( url, pubkey );
console.log('supabase values', { url, pubkey });

export default supabase;
