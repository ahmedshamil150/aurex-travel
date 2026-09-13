/* ===================================================
   Data Module — localStorage CRUD for all entities
   =================================================== */

const Data = {
    KEYS: {
        bookings: 'aurex_bookings',
        quotes: 'aurex_quotes',
        drivers: 'aurex_drivers',
        vehicles: 'aurex_vehicles',
        pricing: 'aurex_pricing',
        settings: 'aurex_settings'
    },

    // ── Generic helpers ──────────────────────────────────────
    _get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    _set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    _genId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // ── Bookings ─────────────────────────────────────────────
    getBookings() {
        return this._get(this.KEYS.bookings);
    },

    getBooking(id) {
        return this.getBookings().find(b => b.id === id);
    },

    addBooking(data) {
        const bookings = this.getBookings();
        const booking = {
            id: this._genId(),
            ...data,
            status: data.status || 'pending',
            payment: data.payment || 'unpaid',
            createdAt: new Date().toISOString()
        };
        bookings.unshift(booking);
        this._set(this.KEYS.bookings, bookings);
        return booking;
    },

    updateBooking(id, updates) {
        const bookings = this.getBookings();
        const idx = bookings.findIndex(b => b.id === id);
        if (idx === -1) return null;
        bookings[idx] = { ...bookings[idx], ...updates, updatedAt: new Date().toISOString() };
        this._set(this.KEYS.bookings, bookings);
        return bookings[idx];
    },

    deleteBooking(id) {
        const bookings = this.getBookings().filter(b => b.id !== id);
        this._set(this.KEYS.bookings, bookings);
    },

    // ── Quotes ───────────────────────────────────────────────
    getQuotes() {
        return this._get(this.KEYS.quotes);
    },

    getQuote(id) {
        return this.getQuotes().find(q => q.id === id);
    },

    addQuote(data) {
        const quotes = this.getQuotes();
        const quote = {
            id: this._genId(),
            ...data,
            status: data.status || 'pending',
            createdAt: new Date().toISOString()
        };
        quotes.unshift(quote);
        this._set(this.KEYS.quotes, quotes);
        return quote;
    },

    updateQuote(id, updates) {
        const quotes = this.getQuotes();
        const idx = quotes.findIndex(q => q.id === id);
        if (idx === -1) return null;
        quotes[idx] = { ...quotes[idx], ...updates, updatedAt: new Date().toISOString() };
        this._set(this.KEYS.quotes, quotes);
        return quotes[idx];
    },

    deleteQuote(id) {
        const quotes = this.getQuotes().filter(q => q.id !== id);
        this._set(this.KEYS.quotes, quotes);
    },

    // ── Drivers ──────────────────────────────────────────────
    getDrivers() {
        return this._get(this.KEYS.drivers);
    },

    getDriver(id) {
        return this.getDrivers().find(d => d.id === id);
    },

    addDriver(data) {
        const drivers = this.getDrivers();
        const driver = {
            id: this._genId(),
            ...data,
            status: data.status || 'pending',
            createdAt: new Date().toISOString()
        };
        drivers.unshift(driver);
        this._set(this.KEYS.drivers, drivers);
        return driver;
    },

    updateDriver(id, updates) {
        const drivers = this.getDrivers();
        const idx = drivers.findIndex(d => d.id === id);
        if (idx === -1) return null;
        drivers[idx] = { ...drivers[idx], ...updates, updatedAt: new Date().toISOString() };
        this._set(this.KEYS.drivers, drivers);
        return drivers[idx];
    },

    deleteDriver(id) {
        const drivers = this.getDrivers().filter(d => d.id !== id);
        this._set(this.KEYS.drivers, drivers);
    },

    // ── Vehicles ─────────────────────────────────────────────
    getVehicles() {
        return this._get(this.KEYS.vehicles);
    },

    getVehicle(id) {
        return this.getVehicles().find(v => v.id === id);
    },

    addVehicle(data) {
        const vehicles = this.getVehicles();
        const vehicle = {
            id: this._genId(),
            ...data,
            status: data.status || 'pending',
            createdAt: new Date().toISOString()
        };
        vehicles.unshift(vehicle);
        this._set(this.KEYS.vehicles, vehicles);
        return vehicle;
    },

    updateVehicle(id, updates) {
        const vehicles = this.getVehicles();
        const idx = vehicles.findIndex(v => v.id === id);
        if (idx === -1) return null;
        vehicles[idx] = { ...vehicles[idx], ...updates, updatedAt: new Date().toISOString() };
        this._set(this.KEYS.vehicles, vehicles);
        return vehicles[idx];
    },

    deleteVehicle(id) {
        const vehicles = this.getVehicles().filter(v => v.id !== id);
        this._set(this.KEYS.vehicles, vehicles);
    },

    // ── Pricing ──────────────────────────────────────────────
    getPricing() {
        const pricing = this._get(this.KEYS.pricing);
        if (pricing.length === 0) {
            return this._getDefaultPricing();
        }
        return pricing;
    },

    updatePricing(pricingData) {
        this._set(this.KEYS.pricing, pricingData);
    },

    _getDefaultPricing() {
        return [
            { id: 'cardiff-heathrow', route: 'Cardiff to Heathrow', saloon: 230, mpv: 250 },
            { id: 'cardiff-bristol', route: 'Cardiff to Bristol', saloon: 135, mpv: 155 },
            { id: 'cardiff-cardiff-airport', route: 'Cardiff to Cardiff Airport', saloon: 60, mpv: 80 },
            { id: 'cardiff-gatwick', route: 'Cardiff to Gatwick', saloon: 320, mpv: 340 },
            { id: 'cardiff-birmingham', route: 'Cardiff to Birmingham', saloon: 230, mpv: 260 },
            { id: 'cardiff-manchester', route: 'Cardiff to Manchester', saloon: 320, mpv: 350 }
        ];
    },

    // ── Stats ────────────────────────────────────────────────
    getStats() {
        const bookings = this.getBookings();
        const quotes = this.getQuotes();
        const drivers = this.getDrivers();
        const vehicles = this.getVehicles();

        const totalRevenue = bookings
            .filter(b => b.payment === 'paid')
            .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

        return {
            totalBookings: bookings.length,
            pendingBookings: bookings.filter(b => b.status === 'pending').length,
            confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
            completedBookings: bookings.filter(b => b.status === 'completed').length,
            totalRevenue: totalRevenue,
            pendingQuotes: quotes.filter(q => q.status === 'pending').length,
            totalQuotes: quotes.length,
            totalDrivers: drivers.length,
            pendingDrivers: drivers.filter(d => d.status === 'pending').length,
            totalVehicles: vehicles.length
        };
    },

    // ── Export to CSV ────────────────────────────────────────
    exportCSV(entity) {
        let data, filename;
        switch (entity) {
            case 'bookings':
                data = this.getBookings();
                filename = 'aurex-bookings.csv';
                break;
            case 'quotes':
                data = this.getQuotes();
                filename = 'aurex-quotes.csv';
                break;
            case 'drivers':
                data = this.getDrivers();
                filename = 'aurex-drivers.csv';
                break;
            case 'vehicles':
                data = this.getVehicles();
                filename = 'aurex-vehicles.csv';
                break;
            default:
                return;
        }

        if (!data.length) {
            Toast.show('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                let val = row[h] || '';
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        Toast.show(`Exported ${data.length} records`, 'success');
    },

    // ── Seed sample data ─────────────────────────────────────
    seedSampleData() {
        if (this.getBookings().length > 0) return;

        const sampleBookings = [
            { name: 'John Smith', email: 'john@example.com', mobile: '+44 7700 123456', pickup: 'Cardiff City Centre', dropoff: 'Heathrow Airport T5', airport: 'Heathrow', date: '2026-07-20', time: '04:30', passengers: 2, suitcases: 2, vehicle: 'Mercedes E-Class', amount: '230', status: 'confirmed', payment: 'paid' },
            { name: 'Sarah Williams', email: 'sarah@example.com', mobile: '+44 7700 234567', pickup: 'Cardiff Bay', dropoff: 'Bristol Airport', airport: 'Bristol', date: '2026-07-22', time: '06:00', passengers: 3, suitcases: 3, vehicle: 'Mercedes V-Class', amount: '155', status: 'pending', payment: 'unpaid' },
            { name: 'Michael Brown', email: 'michael@example.com', mobile: '+44 7700 345678', pickup: 'Cardiff Central Station', dropoff: 'Gatwick Airport', airport: 'Gatwick', date: '2026-07-25', time: '05:15', passengers: 1, suitcases: 1, vehicle: 'Tesla Model Y', amount: '320', status: 'completed', payment: 'paid' },
            { name: 'Emma Jones', email: 'emma@example.com', mobile: '+44 7700 456789', pickup: 'Newport City Centre', dropoff: 'Heathrow Airport T2', airport: 'Heathrow', date: '2026-07-28', time: '03:45', passengers: 4, suitcases: 4, vehicle: 'Mercedes V-Class', amount: '250', status: 'pending', payment: 'unpaid' },
            { name: 'David Taylor', email: 'david@example.com', mobile: '+44 7700 567890', pickup: 'Swansea Marina', dropoff: 'Cardiff Airport', airport: 'Cardiff Airport', date: '2026-07-30', time: '07:00', passengers: 2, suitcases: 1, vehicle: 'Mercedes E-Class', amount: '60', status: 'confirmed', payment: 'paid' }
        ];

        sampleBookings.forEach(b => this.addBooking(b));

        const sampleQuotes = [
            { name: 'James Wilson', mobile: '+44 7700 111222', pickup: 'Barry Town Centre', dropoff: 'Manchester Airport', date: '2026-08-01', time: '04:00', passengers: 2, vehicle: 'Mercedes E-Class', notes: 'Early morning flight', status: 'pending' },
            { name: 'Lisa Anderson', mobile: '+44 7700 333444', pickup: 'Pontypridd', dropoff: 'Stansted Airport', date: '2026-08-05', time: '06:30', passengers: 1, vehicle: 'Tesla Model Y', notes: '', status: 'pending' },
            { name: 'Robert Davies', mobile: '+44 7700 555666', pickup: 'Caerphilly', dropoff: 'Luton Airport', date: '2026-08-10', time: '05:00', passengers: 3, vehicle: 'Mercedes V-Class', notes: 'Need child seat', status: 'accepted' }
        ];

        sampleQuotes.forEach(q => this.addQuote(q));

        const sampleDrivers = [
            { firstName: 'Ahmed', lastName: 'Hassan', mobile: '+44 7700 777888', email: 'ahmed@example.com', phdl: 'Yes', dbs: 'Enhanced - Clear', experience: '5 years', status: 'approved' },
            { firstName: 'Tom', lastName: 'Evans', mobile: '+44 7700 999000', email: 'tom@example.com', phdl: 'Yes', dbs: 'Enhanced - Clear', experience: '3 years', status: 'pending' }
        ];

        sampleDrivers.forEach(d => this.addDriver(d));

        Toast.show('Sample data loaded', 'success');
    }
};
