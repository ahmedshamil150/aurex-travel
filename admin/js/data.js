/* ===================================================
   Data Module — Supabase CRUD for all entities
   =================================================== */

const Data = {
    // ── Generic helpers ──────────────────────────────────────
    async _query(table, options = {}) {
        if (!supabase) initSupabase();
        let query = supabase.from(table).select(options.select || '*');

        if (options.filter) {
            options.filter.forEach(f => {
                query = query.eq(f.column, f.value);
            });
        }
        if (options.search) {
            options.search.forEach(s => {
                query = query.or(`${s.column}.ilike.%${s.value}%`);
            });
        }
        if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) {
            console.error(`Query error on ${table}:`, error);
            return [];
        }
        return data || [];
    },

    // ── Bookings ─────────────────────────────────────────────
    async getBookings(filters = {}) {
        const options = { order: { column: 'created_at', ascending: false } };
        if (filters.search) {
            options.search = [
                { column: 'name', value: filters.search },
                { column: 'pickup', value: filters.search },
                { column: 'dropoff', value: filters.search },
                { column: 'email', value: filters.search },
                { column: 'mobile', value: filters.search }
            ];
        }
        if (filters.status) {
            options.filter = [{ column: 'status', value: filters.status }];
        }
        if (filters.payment) {
            options.filter = options.filter || [];
            options.filter.push({ column: 'payment', value: filters.payment });
        }
        return this._query('bookings', options);
    },

    async getBooking(id) {
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },

    async addBooking(data) {
        const { data: result, error } = await supabase
            .from('bookings')
            .insert({
                name: data.name,
                mobile: data.mobile,
                email: data.email,
                pickup: data.pickup,
                dropoff: data.dropoff,
                airport: data.airport,
                flight: data.flight,
                date: data.date,
                time: data.time,
                passengers: data.passengers,
                suitcases: data.suitcases,
                vehicle: data.vehicle,
                amount: data.amount,
                status: data.status || 'pending',
                payment: data.payment || 'unpaid',
                notes: data.notes
            })
            .select()
            .single();
        if (error) {
            console.error('Add booking error:', error);
            return null;
        }
        return result;
    },

    async updateBooking(id, updates) {
        const { data, error } = await supabase
            .from('bookings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update booking error:', error);
            return null;
        }
        return data;
    },

    async deleteBooking(id) {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) console.error('Delete booking error:', error);
    },

    // ── Quotes ───────────────────────────────────────────────
    async getQuotes(filters = {}) {
        const options = { order: { column: 'created_at', ascending: false } };
        if (filters.search) {
            options.search = [
                { column: 'name', value: filters.search },
                { column: 'pickup', value: filters.search },
                { column: 'dropoff', value: filters.search },
                { column: 'mobile', value: filters.search }
            ];
        }
        if (filters.status) {
            options.filter = [{ column: 'status', value: filters.status }];
        }
        return this._query('quotes', options);
    },

    async getQuote(id) {
        const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },

    async addQuote(data) {
        const { data: result, error } = await supabase
            .from('quotes')
            .insert({
                name: data.name,
                mobile: data.mobile,
                email: data.email,
                pickup: data.pickup,
                dropoff: data.dropoff,
                date: data.date,
                time: data.time,
                passengers: data.passengers,
                vehicle: data.vehicle,
                offered_price: data.offered_price,
                notes: data.notes,
                status: data.status || 'pending'
            })
            .select()
            .single();
        if (error) {
            console.error('Add quote error:', error);
            return null;
        }
        return result;
    },

    async updateQuote(id, updates) {
        const { data, error } = await supabase
            .from('quotes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update quote error:', error);
            return null;
        }
        return data;
    },

    async deleteQuote(id) {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) console.error('Delete quote error:', error);
    },

    // ── Drivers ──────────────────────────────────────────────
    async getDrivers(filters = {}) {
        const options = { order: { column: 'created_at', ascending: false } };
        if (filters.search) {
            options.search = [
                { column: 'first_name', value: filters.search },
                { column: 'last_name', value: filters.search },
                { column: 'email', value: filters.search },
                { column: 'mobile', value: filters.search }
            ];
        }
        if (filters.status) {
            options.filter = [{ column: 'status', value: filters.status }];
        }
        return this._query('drivers', options);
    },

    async getDriver(id) {
        const { data, error } = await supabase.from('drivers').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },

    async addDriver(data) {
        const { data: result, error } = await supabase
            .from('drivers')
            .insert({
                first_name: data.firstName,
                last_name: data.lastName,
                mobile: data.mobile,
                email: data.email,
                phdl: data.phdl,
                dbs_status: data.dbs,
                experience: data.experience,
                notes: data.notes,
                status: data.status || 'pending'
            })
            .select()
            .single();
        if (error) {
            console.error('Add driver error:', error);
            return null;
        }
        return result;
    },

    async updateDriver(id, updates) {
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.firstName) dbUpdates.first_name = updates.firstName;
        if (updates.lastName) dbUpdates.last_name = updates.lastName;
        if (updates.mobile) dbUpdates.mobile = updates.mobile;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.phdl) dbUpdates.phdl = updates.phdl;
        if (updates.dbs) dbUpdates.dbs_status = updates.dbs;
        if (updates.experience) dbUpdates.experience = updates.experience;
        if (updates.notes) dbUpdates.notes = updates.notes;
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('drivers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update driver error:', error);
            return null;
        }
        return data;
    },

    async deleteDriver(id) {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) console.error('Delete driver error:', error);
    },

    // ── Vehicles ─────────────────────────────────────────────
    async getVehicles(filters = {}) {
        const options = { order: { column: 'created_at', ascending: false } };
        if (filters.search) {
            options.search = [
                { column: 'driver_name', value: filters.search },
                { column: 'reg', value: filters.search },
                { column: 'make', value: filters.search },
                { column: 'model', value: filters.search }
            ];
        }
        if (filters.status) {
            options.filter = [{ column: 'status', value: filters.status }];
        }
        return this._query('vehicles', options);
    },

    async getVehicle(id) {
        const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
        if (error) return null;
        return data;
    },

    async addVehicle(data) {
        const { data: result, error } = await supabase
            .from('vehicles')
            .insert({
                driver_name: data.driverName,
                driver_mobile: data.driverMobile,
                driver_email: data.driverEmail,
                reg: data.reg,
                make: data.make,
                model: data.model,
                year: data.year,
                colour: data.colour,
                phvl: data.phvl,
                notes: data.notes,
                status: data.status || 'pending'
            })
            .select()
            .single();
        if (error) {
            console.error('Add vehicle error:', error);
            return null;
        }
        return result;
    },

    async updateVehicle(id, updates) {
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.driverName) dbUpdates.driver_name = updates.driverName;
        if (updates.driverMobile) dbUpdates.driver_mobile = updates.driverMobile;
        if (updates.driverEmail) dbUpdates.driver_email = updates.driverEmail;
        if (updates.reg) dbUpdates.reg = updates.reg;
        if (updates.make) dbUpdates.make = updates.make;
        if (updates.model) dbUpdates.model = updates.model;
        if (updates.year) dbUpdates.year = updates.year;
        if (updates.colour) dbUpdates.colour = updates.colour;
        if (updates.phvl) dbUpdates.phvl = updates.phvl;
        if (updates.notes) dbUpdates.notes = updates.notes;
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('vehicles')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update vehicle error:', error);
            return null;
        }
        return data;
    },

    async deleteVehicle(id) {
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) console.error('Delete vehicle error:', error);
    },

    // ── Pricing ──────────────────────────────────────────────
    async getPricing() {
        const { data, error } = await supabase
            .from('pricing')
            .select('*')
            .order('sort_order', { ascending: true });
        if (error) {
            console.error('Get pricing error:', error);
            return [];
        }
        return data || [];
    },

    async updatePricingRow(id, updates) {
        const { error } = await supabase
            .from('pricing')
            .update({ route: updates.route, saloon: updates.saloon, mpv: updates.mpv })
            .eq('id', id);
        if (error) console.error('Update pricing error:', error);
    },

    async addPricingRow(route, saloon, mpv) {
        const { data, error } = await supabase
            .from('pricing')
            .insert({ route, saloon, mpv, sort_order: 99 })
            .select()
            .single();
        if (error) {
            console.error('Add pricing error:', error);
            return null;
        }
        return data;
    },

    async deletePricingRow(id) {
        const { error } = await supabase.from('pricing').delete().eq('id', id);
        if (error) console.error('Delete pricing error:', error);
    },

    // ── Stats ────────────────────────────────────────────────
    async getStats() {
        const [bookings, quotes, drivers, vehicles] = await Promise.all([
            this.getBookings(),
            this.getQuotes(),
            this.getDrivers(),
            this.getVehicles()
        ]);

        const totalRevenue = bookings
            .filter(b => b.payment === 'paid')
            .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

        return {
            totalBookings: bookings.length,
            pendingBookings: bookings.filter(b => b.status === 'pending').length,
            confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
            completedBookings: bookings.filter(b => b.status === 'completed').length,
            totalRevenue,
            pendingQuotes: quotes.filter(q => q.status === 'pending').length,
            totalQuotes: quotes.length,
            totalDrivers: drivers.length,
            pendingDrivers: drivers.filter(d => d.status === 'pending').length,
            totalVehicles: vehicles.length
        };
    },

    // ── Export to CSV ────────────────────────────────────────
    async exportCSV(entity) {
        let data, filename;
        switch (entity) {
            case 'bookings': data = await this.getBookings(); filename = 'aurex-bookings.csv'; break;
            case 'quotes': data = await this.getQuotes(); filename = 'aurex-quotes.csv'; break;
            case 'drivers': data = await this.getDrivers(); filename = 'aurex-drivers.csv'; break;
            case 'vehicles': data = await this.getVehicles(); filename = 'aurex-vehicles.csv'; break;
            default: return;
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
    }
};
