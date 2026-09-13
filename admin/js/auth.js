/* ===================================================
   Auth Module — Login / Logout / Session Check
   =================================================== */

const Auth = {
    STORAGE_KEY: 'aurex_admin_session',
    PASSWORD_KEY: 'aurex_admin_password',
    DEFAULT_PASSWORD: 'admin123',

    init() {
        if (!localStorage.getItem(this.PASSWORD_KEY)) {
            localStorage.setItem(this.PASSWORD_KEY, this.DEFAULT_PASSWORD);
        }
    },

    login(password) {
        this.init();
        const stored = localStorage.getItem(this.PASSWORD_KEY);
        if (password === stored) {
            const session = { loggedIn: true, timestamp: Date.now() };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'index.html';
    },

    isLoggedIn() {
        const session = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
        return session && session.loggedIn === true;
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    changePassword(currentPass, newPass) {
        const stored = localStorage.getItem(this.PASSWORD_KEY);
        if (currentPass !== stored) return false;
        localStorage.setItem(this.PASSWORD_KEY, newPass);
        return true;
    }
};

Auth.init();
