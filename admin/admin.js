(function(){
  const API = '/api/admin';
  let token = localStorage.getItem('aurex_admin_token');
  let currentUser = JSON.parse(localStorage.getItem('aurex_admin_user') || 'null');
  const contentArea = document.getElementById('contentArea');
  const pageTitle = document.getElementById('pageTitle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // ─── Auth ─────────────────────────────────────
  if (!token || !currentUser) { window.location.href = '/admin/login.html'; return; }

  document.getElementById('adminName').textContent = currentUser.full_name || currentUser.email;
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('aurex_admin_token');
    localStorage.removeItem('aurex_admin_user');
    window.location.href = '/admin/login.html';
  });

  // ─── Mobile sidebar ───────────────────────────
  document.getElementById('hamburgerBtn').addEventListener('click', () => { sidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('show'); });
  sidebarOverlay.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); });

  // ─── API helper ───────────────────────────────
  async function api(path, opts = {}) {
    const url = API + path;
    const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, ...opts };
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    const res = await fetch(url, config);
    if (res.status === 401) { localStorage.clear(); window.location.href = '/admin/login.html'; return; }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
    return res.json();
  }

  // ─── Toast ────────────────────────────────────
  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:2rem;right:2rem;padding:.75rem 1.25rem;border-radius:8px;font-size:.88rem;z-index:9999;animation:fadeIn .3s;color:#fff;background:${type === 'error' ? 'var(--danger)' : 'var(--success)'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ─── Navigation ───────────────────────────────
  function navigate(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (active) active.classList.add('active');
    sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show');
    renderPage(page);
  }

  window.addEventListener('hashchange', () => {
    const page = location.hash.slice(1) || 'dashboard';
    navigate(page);
  });

  // ─── Render Router ────────────────────────────
  async function renderPage(page) {
    contentArea.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';
    const pages = { dashboard: renderDashboard, bookings: renderBookings, quotes: renderQuotes, drivers: renderDrivers, vehicles: renderVehicles, prices: renderPrices, customers: renderCustomers, messages: renderMessages, corporate: renderCorporate };
    const titles = { dashboard: 'Dashboard', bookings: 'Bookings', quotes: 'Quotes', drivers: 'Drivers', vehicles: 'Vehicles', prices: 'Price Management', customers: 'Customers', messages: 'Messages', corporate: 'Corporate Enquiries' };
    pageTitle.textContent = titles[page] || 'Dashboard';
    try { await (pages[page] || pages.dashboard)(); } catch (e) { contentArea.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><p>${e.message}</p></div>`; }
  }

  // ─── DASHBOARD ────────────────────────────────
  async function renderDashboard() {
    const d = await api('/dashboard');
    const s = d.stats;
    const revenue = s.total_revenue.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

    contentArea.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon gold"><i class="fa-solid fa-calendar-check"></i></div><div class="stat-value">${s.total_bookings}</div><div class="stat-label">Total Bookings</div></div>
        <div class="stat-card"><div class="stat-icon yellow"><i class="fa-solid fa-clock"></i></div><div class="stat-value">${s.pending_bookings}</div><div class="stat-label">Pending Bookings</div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-sterling-sign"></i></div><div class="stat-value">${revenue}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-file-invoice"></i></div><div class="stat-value">${s.pending_quotes}</div><div class="stat-label">Pending Quotes</div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-user-tie"></i></div><div class="stat-value">${s.active_drivers}</div><div class="stat-label">Active Drivers</div></div>
        <div class="stat-card"><div class="stat-icon gold"><i class="fa-solid fa-car"></i></div><div class="stat-value">${s.active_vehicles}</div><div class="stat-label">Active Vehicles</div></div>
        <div class="stat-card"><div class="stat-icon red"><i class="fa-solid fa-envelope"></i></div><div class="stat-value">${s.unread_messages}</div><div class="stat-label">Unread Messages</div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-calendar-week"></i></div><div class="stat-value">${s.this_week_bookings}</div><div class="stat-label">This Week</div></div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <h3>Bookings by Status</h3>
          ${renderStatusChart(s.bookings_by_status)}
        </div>
        <div class="chart-card">
          <h3>Recent Activity</h3>
          ${d.recent_bookings.length ? d.recent_bookings.map(b => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:.88rem;font-weight:500">${b.customers?.full_name || 'Unknown'}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">${b.pickup_address} → ${b.dropoff_address}</div>
              </div>
              <span class="status status-${b.status}">${b.status}</span>
            </div>
          `).join('') : '<p style="color:var(--text-muted);font-size:.88rem">No recent bookings</p>'}
        </div>
      </div>

      <div class="chart-card">
        <h3>Upcoming Journeys (Next 7 Days)</h3>
        ${d.upcoming_bookings.length ? `<table style="width:100%"><thead><tr><th>Date</th><th>Passenger</th><th>Route</th><th>Vehicle</th><th>Status</th></tr></thead><tbody>
          ${d.upcoming_bookings.map(b => `<tr><td>${formatDate(b.travel_date)}</td><td>${b.customers?.full_name || '-'}</td><td>${b.pickup_address} → ${b.dropoff_address}</td><td>${b.vehicle_type}</td><td><span class="status status-${b.status}">${b.status}</span></td></tr>`).join('')}
        </tbody></table>` : '<p style="color:var(--text-muted);font-size:.88rem;padding:1rem 0">No upcoming journeys</p>'}
      </div>
    `;

    // Update badges
    if (s.pending_bookings > 0) { document.getElementById('badge-bookings').textContent = s.pending_bookings; document.getElementById('badge-bookings').classList.add('show'); }
    if (s.pending_quotes > 0) { document.getElementById('badge-quotes').textContent = s.pending_quotes; document.getElementById('badge-quotes').classList.add('show'); }
    if (s.unread_messages > 0) { document.getElementById('badge-messages').textContent = s.unread_messages; document.getElementById('badge-messages').classList.add('show'); }
  }

  function renderStatusChart(counts) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const colors = { pending: '#d29922', confirmed: '#58a6ff', assigned: '#c9a84c', in_progress: '#58a6ff', completed: '#3fb950', cancelled: '#f85149' };
    const bar = Object.entries(counts).map(([k, v]) => `<div style="width:${(v / total * 100)}%;background:${colors[k] || '#6e7681'}" title="${k}: ${v}"></div>`).join('');
    const legend = Object.entries(counts).map(([k, v]) => `<div class="chart-legend-item"><div class="chart-legend-dot" style="background:${colors[k] || '#6e7681'}"></div>${k}: ${v}</div>`).join('');
    return `<div class="status-bar">${bar}</div><div class="chart-legend">${legend}</div>`;
  }

  // ─── BOOKINGS ─────────────────────────────────
  let bookingsPage = 1, bookingsStatus = 'all', bookingsSearch = '';
  async function renderBookings() {
    const params = new URLSearchParams({ page: bookingsPage, limit: 25, status: bookingsStatus });
    if (bookingsSearch) params.set('search', bookingsSearch);
    const d = await api('/bookings?' + params);

    contentArea.innerHTML = `
      <div class="table-controls">
        <input type="text" placeholder="Search bookings..." id="bookingSearch" value="${bookingsSearch}">
        <select id="bookingStatusFilter">
          <option value="all" ${bookingsStatus === 'all' ? 'selected' : ''}>All Status</option>
          <option value="pending" ${bookingsStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${bookingsStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="assigned" ${bookingsStatus === 'assigned' ? 'selected' : ''}>Assigned</option>
          <option value="completed" ${bookingsStatus === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${bookingsStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="exportCSV('bookings')"><i class="fa-solid fa-download"></i> Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Passenger</th><th>Route</th><th>Vehicle</th><th>Price</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
          <tbody id="bookingsTableBody">
            ${d.data.length ? d.data.map(b => `<tr>
              <td style="font-family:monospace;font-size:.78rem">${b.id.slice(0, 8)}</td>
              <td>${formatDate(b.travel_date)}</td>
              <td>${b.customers?.full_name || '-'}<br><span style="font-size:.75rem;color:var(--text-muted)">${b.customers?.mobile || ''}</span></td>
              <td><span style="font-size:.82rem">${truncate(b.pickup_address, 25)} → ${truncate(b.dropoff_address, 25)}</span></td>
              <td>${b.vehicle_type}</td>
              <td style="font-weight:600">${b.final_price ? '£' + b.final_price : b.estimated_price ? '£' + b.estimated_price + ' est' : '-'}</td>
              <td><span class="status status-${b.status}">${b.status}</span></td>
              <td><span class="status status-${b.payment_status}">${b.payment_status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="viewBooking('${b.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-accent btn-sm" onclick="quickStatusBooking('${b.id}','${b.status}')"><i class="fa-solid fa-arrow-right"></i></button>
              </td>
            </tr>`).join('') : '<tr><td colspan="9" class="empty-state"><p>No bookings found</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div>
        <div class="pagination-btns">
          <button class="btn btn-outline btn-sm" ${d.page <= 1 ? 'disabled' : ''} onclick="bookingsPrevPage()">Previous</button>
          <button class="btn btn-outline btn-sm" ${d.page >= Math.ceil((d.total || 1) / d.limit) ? 'disabled' : ''} onclick="bookingsNextPage()">Next</button>
        </div>
      </div>
    `;

    document.getElementById('bookingSearch').addEventListener('input', debounce((e) => { bookingsSearch = e.target.value; bookingsPage = 1; renderBookings(); }, 300));
    document.getElementById('bookingStatusFilter').addEventListener('change', (e) => { bookingsStatus = e.target.value; bookingsPage = 1; renderBookings(); });
  }

  window.bookingsPrevPage = () => { bookingsPage--; renderBookings(); };
  window.bookingsNextPage = () => { bookingsPage++; renderBookings(); };

  window.viewBooking = async function(id) {
    const b = await api('/bookings?id=' + id);
    contentArea.innerHTML = `
      <div class="detail-panel">
        <div class="detail-header">
          <h2>Booking ${b.id.slice(0, 8)}</h2>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn-outline btn-sm" onclick="renderBookings()"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button class="btn btn-success btn-sm" onclick="updateBooking('${b.id}','status','confirmed')"><i class="fa-solid fa-check"></i> Confirm</button>
            <button class="btn btn-danger btn-sm" onclick="updateBooking('${b.id}','status','cancelled')"><i class="fa-solid fa-xmark"></i> Cancel</button>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-field"><label>Passenger</label><div class="value">${b.customers?.full_name || '-'}</div></div>
          <div class="detail-field"><label>Mobile</label><div class="value">${b.customers?.mobile || '-'}</div></div>
          <div class="detail-field"><label>Email</label><div class="value">${b.customers?.email || '-'}</div></div>
          <div class="detail-field"><label>Vehicle</label><div class="value">${b.vehicle_type}</div></div>
          <div class="detail-field"><label>Pickup</label><div class="value">${b.pickup_address}</div></div>
          <div class="detail-field"><label>Dropoff</label><div class="value">${b.dropoff_address}</div></div>
          <div class="detail-field"><label>Date</label><div class="value">${formatDate(b.travel_date)}</div></div>
          <div class="detail-field"><label>Time</label><div class="value">${b.travel_time || '-'}</div></div>
          <div class="detail-field"><label>Flight</label><div class="value">${b.flight_number || '-'}</div></div>
          <div class="detail-field"><label>Trip Type</label><div class="value">${b.trip_type}</div></div>
          <div class="detail-field"><label>Passengers</label><div class="value">${b.passengers}</div></div>
          <div class="detail-field"><label>Distance</label><div class="value">${b.distance_miles ? b.distance_miles + ' mi' : '-'}</div></div>
          <div class="detail-field"><label>Estimated Price</label><div class="value">${b.estimated_price ? '£' + b.estimated_price : '-'}</div></div>
          <div class="detail-field"><label>Final Price</label><div class="value">${b.final_price ? '£' + b.final_price : '-'}</div></div>
          <div class="detail-field"><label>Status</label><div class="value"><span class="status status-${b.status}">${b.status}</span></div></div>
          <div class="detail-field"><label>Payment</label><div class="value"><span class="status status-${b.payment_status}">${b.payment_status}</span></div></div>
          <div class="detail-field"><label>Payment Method</label><div class="value">${b.payment_method || '-'}</div></div>
          <div class="detail-field"><label>Admin Notes</label><div class="value">${b.admin_notes || '-'}</div></div>
        </div>
        <div style="margin-top:1.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="btn btn-accent btn-sm" onclick="updateBookingPayment('${b.id}','paid','stripe')"><i class="fa-solid fa-credit-card"></i> Mark Paid (Stripe)</button>
          <button class="btn btn-accent btn-sm" onclick="updateBookingPayment('${b.id}','paid','cash')"><i class="fa-solid fa-money-bill"></i> Mark Paid (Cash)</button>
          <button class="btn btn-outline btn-sm" onclick="sendBookingWhatsApp('${b.id}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
        </div>
      </div>
    `;
  };

  window.updateBooking = async function(id, field, value) {
    await api('/bookings', { method: 'PATCH', body: { id, [field]: value } });
    toast('Booking updated'); viewBooking(id);
  };

  window.updateBookingPayment = async function(id, paymentStatus, method) {
    await api('/bookings', { method: 'PATCH', body: { id, payment_status: paymentStatus, payment_method: method } });
    toast('Payment updated'); viewBooking(id);
  };

  window.quickStatusBooking = function(id, current) {
    const flow = { pending: 'confirmed', confirmed: 'assigned', assigned: 'in_progress', in_progress: 'completed' };
    const next = flow[current];
    if (next) updateBooking(id, 'status', next);
  };

  window.sendBookingWhatsApp = async function(id) {
    const b = await api('/bookings?id=' + id);
    const msg = `*Aurex Executive Travel*\n\nBooking: ${b.id.slice(0,8)}\nFrom: ${b.pickup_address}\nTo: ${b.dropoff_address}\nDate: ${b.travel_date}\nVehicle: ${b.vehicle_type}\nStatus: ${b.status}`;
    window.open(`https://wa.me/447405805932?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ─── QUOTES ───────────────────────────────────
  let quotesPage = 1, quotesStatus = 'all';
  async function renderQuotes() {
    const params = new URLSearchParams({ page: quotesPage, limit: 25, status: quotesStatus });
    const d = await api('/quotes?' + params);
    contentArea.innerHTML = `
      <div class="table-controls">
        <select id="quoteStatusFilter">
          <option value="all" ${quotesStatus === 'all' ? 'selected' : ''}>All Status</option>
          <option value="pending" ${quotesStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="quoted" ${quotesStatus === 'quoted' ? 'selected' : ''}>Quoted</option>
          <option value="accepted" ${quotesStatus === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="rejected" ${quotesStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Passenger</th><th>Route</th><th>Vehicle</th><th>Their Price</th><th>Our Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(q => `<tr>
              <td>${formatDate(q.created_at)}</td>
              <td>${q.customers?.full_name || '-'}<br><span style="font-size:.75rem;color:var(--text-muted)">${q.customers?.mobile || ''}</span></td>
              <td>${truncate(q.pickup_address, 25)} → ${truncate(q.dropoff_address, 25)}</td>
              <td>${q.vehicle_type || '-'}</td>
              <td>${q.offered_price ? '£' + q.offered_price : '-'}</td>
              <td>${q.our_price ? '£' + q.our_price : '-'}</td>
              <td><span class="status status-${q.status}">${q.status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="viewQuote('${q.id}')"><i class="fa-solid fa-eye"></i></button>
                ${q.status === 'pending' ? `<button class="btn btn-accent btn-sm" onclick="quoteToBooking('${q.id}')"><i class="fa-solid fa-arrow-right"></i> Convert</button>` : ''}
              </td>
            </tr>`).join('') : '<tr><td colspan="8" class="empty-state"><p>No quotes found</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div>
        <div class="pagination-btns">
          <button class="btn btn-outline btn-sm" ${d.page <= 1 ? 'disabled' : ''} onclick="quotesPage--;renderQuotes()">Previous</button>
          <button class="btn btn-outline btn-sm" onclick="quotesPage++;renderQuotes()">Next</button>
        </div>
      </div>
    `;
    document.getElementById('quoteStatusFilter').addEventListener('change', (e) => { quotesStatus = e.target.value; quotesPage = 1; renderQuotes(); });
  }

  window.viewQuote = async function(id) {
    const q = await api('/quotes?id=' + id);
    contentArea.innerHTML = `
      <div class="detail-panel">
        <div class="detail-header">
          <h2>Quote ${q.id.slice(0, 8)}</h2>
          <button class="btn btn-outline btn-sm" onclick="renderQuotes()"><i class="fa-solid fa-arrow-left"></i> Back</button>
        </div>
        <div class="detail-grid">
          <div class="detail-field"><label>Passenger</label><div class="value">${q.customers?.full_name || '-'}</div></div>
          <div class="detail-field"><label>Mobile</label><div class="value">${q.customers?.mobile || '-'}</div></div>
          <div class="detail-field"><label>Pickup</label><div class="value">${q.pickup_address}</div></div>
          <div class="detail-field"><label>Dropoff</label><div class="value">${q.dropoff_address}</div></div>
          <div class="detail-field"><label>Date</label><div class="value">${q.travel_date ? formatDate(q.travel_date) : '-'}</div></div>
          <div class="detail-field"><label>Vehicle</label><div class="value">${q.vehicle_type || '-'}</div></div>
          <div class="detail-field"><label>Their Price</label><div class="value">${q.offered_price ? '£' + q.offered_price : '-'}</div></div>
          <div class="detail-field"><label>Our Price</label><div class="value">${q.our_price ? '£' + q.our_price : '-'}</div></div>
          <div class="detail-field"><label>Status</label><div class="value"><span class="status status-${q.status}">${q.status}</span></div></div>
          <div class="detail-field"><label>Notes</label><div class="value">${q.admin_notes || '-'}</div></div>
        </div>
        <div style="margin-top:1.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <input type="number" id="ourPriceInput" placeholder="Our price (£)" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:.5rem;color:var(--text-primary);width:150px">
          <button class="btn btn-accent btn-sm" onclick="setQuotePrice('${q.id}')"><i class="fa-solid fa-check"></i> Set Price & Quote</button>
          <button class="btn btn-success btn-sm" onclick="quoteToBooking('${q.id}')"><i class="fa-solid fa-arrow-right"></i> Convert to Booking</button>
          <button class="btn btn-danger btn-sm" onclick="updateQuote('${q.id}','status','rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
        </div>
      </div>
    `;
  };

  window.setQuotePrice = async function(id) {
    const price = document.getElementById('ourPriceInput').value;
    if (!price) return;
    await api('/quotes', { method: 'PATCH', body: { id, our_price: parseFloat(price), status: 'quoted' } });
    toast('Price set and quote sent'); viewQuote(id);
  };

  window.updateQuote = async function(id, field, value) {
    await api('/quotes', { method: 'PATCH', body: { id, [field]: value } });
    toast('Quote updated'); renderQuotes();
  };

  window.quoteToBooking = async function(quoteId) {
    await api('/quotes', { method: 'POST', body: { action: 'convert_to_booking', quote_id: quoteId } });
    toast('Quote converted to booking'); renderQuotes();
  };

  // ─── DRIVERS ──────────────────────────────────
  let driversPage = 1, driversStatus = 'all';
  async function renderDrivers() {
    const params = new URLSearchParams({ page: driversPage, limit: 25, status: driversStatus });
    const d = await api('/drivers?' + params);
    contentArea.innerHTML = `
      <div class="table-controls">
        <input type="text" placeholder="Search drivers..." id="driverSearch" oninput="driversPage=1;renderDrivers()">
        <select id="driverStatusFilter">
          <option value="all" ${driversStatus === 'all' ? 'selected' : ''}>All</option>
          <option value="pending" ${driversStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="approved" ${driversStatus === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="suspended" ${driversStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
          <option value="rejected" ${driversStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Mobile</th><th>PHDL</th><th>DBS</th><th>Experience</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(dr => `<tr>
              <td>${dr.first_name} ${dr.last_name}</td>
              <td>${dr.mobile}</td>
              <td>${dr.phdl_number || '-'}</td>
              <td>${dr.dbs_status || '-'}</td>
              <td>${dr.experience_years ? dr.experience_years + ' yrs' : '-'}</td>
              <td><span class="status status-${dr.status}">${dr.status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="viewDriver('${dr.id}')"><i class="fa-solid fa-eye"></i></button>
                ${dr.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="updateDriver('${dr.id}','status','approved')"><i class="fa-solid fa-check"></i></button>
                <button class="btn btn-danger btn-sm" onclick="updateDriver('${dr.id}','status','rejected')"><i class="fa-solid fa-xmark"></i></button>` : ''}
              </td>
            </tr>`).join('') : '<tr><td colspan="7" class="empty-state"><p>No drivers found</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination"><div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div><div class="pagination-btns"><button class="btn btn-outline btn-sm" ${d.page<=1?'disabled':''} onclick="driversPage--;renderDrivers()">Prev</button><button class="btn btn-outline btn-sm" onclick="driversPage++;renderDrivers()">Next</button></div></div>
    `;
    document.getElementById('driverStatusFilter').addEventListener('change', (e) => { driversStatus = e.target.value; driversPage = 1; renderDrivers(); });
  }

  window.viewDriver = async function(id) {
    const dr = await api('/drivers?id=' + id);
    contentArea.innerHTML = `
      <div class="detail-panel">
        <div class="detail-header"><h2>${dr.first_name} ${dr.last_name}</h2>
          <div style="display:flex;gap:.5rem"><button class="btn btn-outline btn-sm" onclick="renderDrivers()"><i class="fa-solid fa-arrow-left"></i> Back</button>
          ${dr.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="updateDriver('${dr.id}','status','approved')"><i class="fa-solid fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm" onclick="updateDriver('${dr.id}','status','rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>` : ''}
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-field"><label>Mobile</label><div class="value">${dr.mobile}</div></div>
          <div class="detail-field"><label>Email</label><div class="value">${dr.email || '-'}</div></div>
          <div class="detail-field"><label>PHDL</label><div class="value">${dr.phdl_number || '-'}</div></div>
          <div class="detail-field"><label>DBS Status</label><div class="value">${dr.dbs_status || '-'}</div></div>
          <div class="detail-field"><label>Experience</label><div class="value">${dr.experience_years ? dr.experience_years + ' years' : '-'}</div></div>
          <div class="detail-field"><label>Status</label><div class="value"><span class="status status-${dr.status}">${dr.status}</span></div></div>
          <div class="detail-field"><label>Notes</label><div class="value">${dr.admin_notes || '-'}</div></div>
        </div>
      </div>
    `;
  };

  window.updateDriver = async function(id, field, value) {
    await api('/drivers', { method: 'PATCH', body: { id, [field]: value } });
    toast('Driver updated'); renderDrivers();
  };

  // ─── VEHICLES ─────────────────────────────────
  let vehiclesPage = 1, vehiclesStatus = 'all';
  async function renderVehicles() {
    const params = new URLSearchParams({ page: vehiclesPage, limit: 25, status: vehiclesStatus });
    const d = await api('/vehicles?' + params);
    contentArea.innerHTML = `
      <div class="table-controls">
        <input type="text" placeholder="Search vehicles..." id="vehicleSearch" oninput="vehiclesPage=1;renderVehicles()">
        <select id="vehicleStatusFilter">
          <option value="all" ${vehiclesStatus === 'all' ? 'selected' : ''}>All</option>
          <option value="pending" ${vehiclesStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="approved" ${vehiclesStatus === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="active" ${vehiclesStatus === 'active' ? 'selected' : ''}>Active</option>
          <option value="suspended" ${vehiclesStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Reg</th><th>Make/Model</th><th>Year</th><th>Type</th><th>Driver</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(v => `<tr>
              <td style="font-weight:600">${v.registration}</td>
              <td>${v.make} ${v.model}</td>
              <td>${v.year || '-'}</td>
              <td>${v.vehicle_type || '-'}</td>
              <td>${v.drivers ? v.drivers.first_name + ' ' + v.drivers.last_name : '-'}</td>
              <td><span class="status status-${v.status}">${v.status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="viewVehicle('${v.id}')"><i class="fa-solid fa-eye"></i></button>
                ${v.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="updateVehicle('${v.id}','status','approved')"><i class="fa-solid fa-check"></i></button>
                <button class="btn btn-danger btn-sm" onclick="updateVehicle('${v.id}','status','rejected')"><i class="fa-solid fa-xmark"></i></button>` : ''}
              </td>
            </tr>`).join('') : '<tr><td colspan="7" class="empty-state"><p>No vehicles found</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination"><div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div><div class="pagination-btns"><button class="btn btn-outline btn-sm" ${d.page<=1?'disabled':''} onclick="vehiclesPage--;renderVehicles()">Prev</button><button class="btn btn-outline btn-sm" onclick="vehiclesPage++;renderVehicles()">Next</button></div></div>
    `;
    document.getElementById('vehicleStatusFilter').addEventListener('change', (e) => { vehiclesStatus = e.target.value; vehiclesPage = 1; renderVehicles(); });
  }

  window.viewVehicle = async function(id) {
    const v = await api('/vehicles?id=' + id);
    contentArea.innerHTML = `
      <div class="detail-panel">
        <div class="detail-header"><h2>${v.registration} — ${v.make} ${v.model}</h2>
          <div style="display:flex;gap:.5rem"><button class="btn btn-outline btn-sm" onclick="renderVehicles()"><i class="fa-solid fa-arrow-left"></i> Back</button>
          ${v.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="updateVehicle('${v.id}','status','approved')"><i class="fa-solid fa-check"></i> Approve</button>
          <button class="btn btn-danger btn-sm" onclick="updateVehicle('${v.id}','status','rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>` : ''}
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-field"><label>Registration</label><div class="value">${v.registration}</div></div>
          <div class="detail-field"><label>Make</label><div class="value">${v.make}</div></div>
          <div class="detail-field"><label>Model</label><div class="value">${v.model}</div></div>
          <div class="detail-field"><label>Year</label><div class="value">${v.year || '-'}</div></div>
          <div class="detail-field"><label>Colour</label><div class="value">${v.colour || '-'}</div></div>
          <div class="detail-field"><label>Type</label><div class="value">${v.vehicle_type || '-'}</div></div>
          <div class="detail-field"><label>PHVL</label><div class="value">${v.phvl_number || '-'}</div></div>
          <div class="detail-field"><label>MOT Expiry</label><div class="value">${v.mot_expiry || '-'}</div></div>
          <div class="detail-field"><label>Insurance Expiry</label><div class="value">${v.insurance_expiry || '-'}</div></div>
          <div class="detail-field"><label>Driver</label><div class="value">${v.drivers ? v.drivers.first_name + ' ' + v.drivers.last_name + ' (' + v.drivers.mobile + ')' : '-'}</div></div>
          <div class="detail-field"><label>Status</label><div class="value"><span class="status status-${v.status}">${v.status}</span></div></div>
        </div>
      </div>
    `;
  };

  window.updateVehicle = async function(id, field, value) {
    await api('/vehicles', { method: 'PATCH', body: { id, [field]: value } });
    toast('Vehicle updated'); renderVehicles();
  };

  // ─── PRICES ───────────────────────────────────
  async function renderPrices() {
    const prices = await api('/prices');
    contentArea.innerHTML = `
      <div style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
        <p style="color:var(--text-secondary);font-size:.88rem">Edit route prices below. Changes take effect immediately on the public site.</p>
        <button class="btn btn-accent" onclick="addPriceForm()"><i class="fa-solid fa-plus"></i> Add Route</button>
      </div>
      <div id="addPriceForm" style="display:none;margin-bottom:1.5rem"></div>
      <div class="price-grid" id="priceGrid">
        ${prices.map(p => `
          <div class="price-card" id="price-${p.id}">
            <div class="route"><i class="fa-solid fa-route"></i> ${capitalize(p.origin)} → ${capitalize(p.destination)}</div>
            <div class="price-inputs">
              <div class="field"><label>Saloon (£)</label><input type="number" id="saloon-${p.id}" value="${p.saloon_price}" step="0.01"></div>
              <div class="field"><label>MPV (£)</label><input type="number" id="mpv-${p.id}" value="${p.mpv_price}" step="0.01"></div>
            </div>
            <div class="price-card-actions">
              <button class="btn btn-accent btn-sm" onclick="savePrice('${p.id}')"><i class="fa-solid fa-check"></i> Save</button>
              <button class="btn btn-outline btn-sm" onclick="togglePrice('${p.id}',${!p.is_active})"><i class="fa-solid fa-${p.is_active ? 'eye-slash' : 'eye'}"></i> ${p.is_active ? 'Disable' : 'Enable'}</button>
              <button class="btn btn-danger btn-sm" onclick="deletePrice('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  window.savePrice = async function(id) {
    const saloon = document.getElementById('saloon-' + id).value;
    const mpv = document.getElementById('mpv-' + id).value;
    await api('/prices', { method: 'PATCH', body: { id, saloon_price: parseFloat(saloon), mpv_price: parseFloat(mpv) } });
    toast('Price saved');
  };

  window.togglePrice = async function(id, isActive) {
    await api('/prices', { method: 'PATCH', body: { id, is_active: isActive } });
    toast(isActive ? 'Route enabled' : 'Route disabled'); renderPrices();
  };

  window.deletePrice = async function(id) {
    if (!confirm('Delete this route?')) return;
    await api('/prices?id=' + id, { method: 'DELETE' });
    toast('Route deleted'); renderPrices();
  };

  window.addPriceForm = function() {
    const el = document.getElementById('addPriceForm');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    el.innerHTML = `
      <div class="detail-panel">
        <h3 style="margin-bottom:1rem">Add New Route</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem">
          <input type="text" id="newOrigin" placeholder="Origin (e.g. cardiff)" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:.5rem;color:var(--text-primary)">
          <input type="text" id="newDest" placeholder="Destination (e.g. heathrow)" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:.5rem;color:var(--text-primary)">
          <input type="number" id="newSaloon" placeholder="Saloon (£)" step="0.01" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:.5rem;color:var(--text-primary)">
          <input type="number" id="newMpv" placeholder="MPV (£)" step="0.01" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:6px;padding:.5rem;color:var(--text-primary)">
          <button class="btn btn-accent" onclick="createPrice()"><i class="fa-solid fa-plus"></i> Add</button>
        </div>
      </div>
    `;
  };

  window.createPrice = async function() {
    const origin = document.getElementById('newOrigin').value;
    const destination = document.getElementById('newDest').value;
    const saloon_price = document.getElementById('newSaloon').value;
    const mpv_price = document.getElementById('newMpv').value;
    if (!origin || !destination || !saloon_price || !mpv_price) return toast('Fill all fields', 'error');
    await api('/prices', { method: 'POST', body: { origin, destination, saloon_price, mpv_price } });
    toast('Route added'); renderPrices();
  };

  // ─── CUSTOMERS ────────────────────────────────
  let customersPage = 1;
  async function renderCustomers() {
    const params = new URLSearchParams({ page: customersPage, limit: 25 });
    const d = await api('/customers?' + params);
    contentArea.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Company</th><th>Joined</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(c => `<tr>
              <td>${c.full_name}</td><td>${c.email || '-'}</td><td>${c.mobile}</td><td>${c.company || '-'}</td><td>${formatDate(c.created_at)}</td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty-state"><p>No customers found</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination"><div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div><div class="pagination-btns"><button class="btn btn-outline btn-sm" ${d.page<=1?'disabled':''} onclick="customersPage--;renderCustomers()">Prev</button><button class="btn btn-outline btn-sm" onclick="customersPage++;renderCustomers()">Next</button></div></div>
    `;
  }

  // ─── MESSAGES ─────────────────────────────────
  let messagesPage = 1;
  async function renderMessages() {
    const params = new URLSearchParams({ page: messagesPage, limit: 25, type: 'messages' });
    const d = await api('/messages?' + params);
    contentArea.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>From</th><th>Subject</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(m => `<tr>
              <td>${formatDate(m.created_at)}</td>
              <td>${m.customers?.full_name || '-'}<br><span style="font-size:.75rem;color:var(--text-muted)">${m.customers?.email || ''}</span></td>
              <td>${m.subject || '-'}</td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${truncate(m.message, 50)}</td>
              <td><span class="status status-${m.status}">${m.status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="markMessageRead('${m.id}')"><i class="fa-solid fa-check"></i></button>
              </td>
            </tr>`).join('') : '<tr><td colspan="6" class="empty-state"><p>No messages</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination"><div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div><div class="pagination-btns"><button class="btn btn-outline btn-sm" ${d.page<=1?'disabled':''} onclick="messagesPage--;renderMessages()">Prev</button><button class="btn btn-outline btn-sm" onclick="messagesPage++;renderMessages()">Next</button></div></div>
    `;
  }

  window.markMessageRead = async function(id) {
    await api('/messages', { method: 'PATCH', body: { id, status: 'read', type: 'messages' } });
    toast('Marked as read'); renderMessages();
  };

  // ─── CORPORATE ────────────────────────────────
  let corporatePage = 1;
  async function renderCorporate() {
    const params = new URLSearchParams({ page: corporatePage, limit: 25, type: 'corporate' });
    const d = await api('/messages?' + params);
    contentArea.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Company</th><th>Contact</th><th>Journeys/Month</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${d.data.length ? d.data.map(c => `<tr>
              <td>${formatDate(c.created_at)}</td>
              <td style="font-weight:600">${c.company_name}</td>
              <td>${c.customers?.full_name || '-'}<br><span style="font-size:.75rem;color:var(--text-muted)">${c.customers?.mobile || ''}</span></td>
              <td>${c.journeys_per_month || '-'}</td>
              <td><span class="status status-${c.status}">${c.status}</span></td>
              <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="updateCorporate('${c.id}','status','contacted')"><i class="fa-solid fa-phone"></i></button>
                <button class="btn btn-success btn-sm" onclick="updateCorporate('${c.id}','status','active')"><i class="fa-solid fa-check"></i></button>
              </td>
            </tr>`).join('') : '<tr><td colspan="6" class="empty-state"><p>No corporate enquiries</p></td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination"><div class="pagination-info">Page ${d.page} of ${Math.ceil((d.total || 1) / d.limit)} (${d.total} total)</div><div class="pagination-btns"><button class="btn btn-outline btn-sm" ${d.page<=1?'disabled':''} onclick="corporatePage--;renderCorporate()">Prev</button><button class="btn btn-outline btn-sm" onclick="corporatePage++;renderCorporate()">Next</button></div></div>
    `;
  }

  window.updateCorporate = async function(id, field, value) {
    await api('/messages', { method: 'PATCH', body: { id, [field]: value, type: 'corporate' } });
    toast('Updated'); renderCorporate();
  };

  // ─── EXPORT CSV ───────────────────────────────
  window.exportCSV = async function(type) {
    const d = await api('/' + type + '?limit=1000');
    const rows = d.data || [];
    if (!rows.length) return toast('No data to export', 'error');
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => '"' + String(r[h] || '').replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = type + '.csv'; a.click();
    toast('CSV downloaded');
  };

  // ─── UTILS ────────────────────────────────────
  function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '...' : s || '-'; }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  // ─── INIT ─────────────────────────────────────
  navigate(location.hash.slice(1) || 'dashboard');
})();
