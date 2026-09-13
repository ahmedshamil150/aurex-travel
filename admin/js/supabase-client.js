/* ===================================================
   Supabase Client — Initialize connection
   =================================================== */

const SUPABASE_URL = 'https://lmfosbyzgwghglsyvauc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZm9zYnl6Z3dnaGdsc3l2YXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzE5OTcsImV4cCI6MjEwNDI0Nzk5N30.xwW2osFXcTR0cDRMk9fkLJwYfUonVvkMinT8CKcoQsE';

let supabase = null;

function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}

/* ===================================================
   Helper: SHA-256 hash for password verification
   =================================================== */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
