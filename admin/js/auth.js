/* ===================================================
   Auth Module — Supabase-backed (plain text password)
   =================================================== */

const Auth = {
    SESSION_KEY: 'aurex_admin_session',
    ADMIN_EMAIL: 'admin@aurex.co.uk',
    ADMIN_PASSWORD: 'admin123',

    async login(email, password) {
        if (!db) {
            if (!initSupabase()) return false;
        }

        try {
            const { data, error } = await db
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error || !data) {
                if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ loggedIn: true, email, timestamp: Date.now() }));
                    return true;
                }
                return false;
            }

            localStorage.setItem(this.SESSION_KEY, JSON.stringify({ loggedIn: true, email: data.email, timestamp: Date.now() }));
            return true;
        } catch (err) {
            console.error('Login error:', err);
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                localStorage.setItem(this.SESSION_KEY, JSON.stringify({ loggedIn: true, email, timestamp: Date.now() }));
                return true;
            }
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
