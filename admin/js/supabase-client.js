/* ===================================================
   Supabase Client — Initialize connection
   =================================================== */

const SUPABASE_URL = 'https://lmfosbyzgwghglsyvauc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZm9zYnl6Z3dnaGdsc3l2YXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzE5OTcsImV4cCI6MjEwNDI0Nzk5N30.xwW2osFXcTR0cDRMk9fkLJwYfUonVvkMinT8CKcoQsE';

let db = null;

function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        }
        console.error('Supabase CDN not loaded');
        return false;
    } catch (e) {
        console.error('Supabase init error:', e);
        return false;
    }
}
