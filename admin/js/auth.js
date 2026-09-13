/* ===================================================
   Auth Module — Supabase-backed (plain text password)
   =================================================== */

const Auth = {
    SESSION_KEY: 'aurex_admin_session',
    ADMIN_EMAIL: 'admin@aurex.co.uk',
    ADMIN_PASSWORD: 'admin123',

    async login(email, password) {
        if (!supabase) {
            if (!initSupabase()) {
                console.error('Supabase not loaded');
                return false;
            }
        }

        try {
            // Query admin_users table
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error) {
                console.error('Login query error:', error);
                // If table doesn't exist or query fails, fall back to hardcoded check
                if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                    const session = { loggedIn: true, email: email, timestamp: Date.now() };
                    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
                    return true;
                }
                return false;
            }

            if (data) {
                const session = { loggedIn: true, email: data.email, timestamp: Date.now() };
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
                return true;
            }

            return false;
        } catch (err) {
            console.error('Login error:', err);
            // Fallback to hardcoded check
            if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
                const session = { loggedIn: true, email: email, timestamp: Date.now() };
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
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
