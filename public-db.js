/* ===================================================
   Public Supabase Client — for website pages
   =================================================== */

const PUBLIC_SUPABASE_URL = 'https://lmfosbyzgwghglsyvauc.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZm9zYnl6Z3dnaGdsc3l2YXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzE5OTcsImV4cCI6MjEwNDI0Nzk5N30.xwW2osFXcTR0cDRMk9fkLJwYfUonVvkMinT8CKcoQsE';

let publicDb = null;

function initPublicDb() {
    try {
        if (window.supabase && window.supabase.createClient) {
            publicDb = window.supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Public Supabase init error:', e);
        return false;
    }
}
