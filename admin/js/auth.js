/* ===================================================
   Auth Module — Supabase-backed login / session
   =================================================== */

const Auth = {
    SESSION_KEY: 'aurex_admin_session',

    async login(email, password) {
        if (!supabase) {
            if (!initSupabase()) {
                console.error('Supabase not loaded');
                return false;
            }
        }

        try {
            const passwordHash = await sha256(password);
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('password_hash', passwordHash)
                .single();

            if (error || !data) {
                return false;
            }

            const session = {
                loggedIn: true,
                email: data.email,
                id: data.id,
                timestamp: Date.now()
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'index.html';
    },

    isLoggedIn() {
        const session = JSON.parse(localStorage.getItem(this.SESSION_KEY));
        return session && session.loggedIn === true;
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    getSession() {
        return JSON.parse(localStorage.getItem(this.SESSION_KEY) || '{}');
    }
};
