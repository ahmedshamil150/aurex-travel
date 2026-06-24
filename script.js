document.addEventListener('DOMContentLoaded', () => {
    const WA_NUMBER     = '447905298692';
    const COMPANY_EMAIL = 'nayyer.zaman@gmail.com';
    const GEO_KEY       = '1681c0e18bb747a8a7317699a0c094f3';

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.style.borderBottom = window.scrollY > 50
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(255,255,255,0.05)';
    });

    // --- Mobile Menu Toggle ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const spans = hamburger.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity   = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity   = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // --- Desktop Dropdown ---
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const menu   = dropdown.querySelector('.nav-dropdown-menu');
        let closeTimer = null;

        function openMenu()  { clearTimeout(closeTimer); menu.classList.add('open'); if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = 'rotate(180deg)'; }
        function closeMenu() { closeTimer = setTimeout(() => { menu.classList.remove('open'); if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = ''; }, 150); }

        if (toggle && menu) {
            dropdown.addEventListener('mouseenter', openMenu);
            dropdown.addEventListener('mouseleave', closeMenu);
            menu.addEventListener('mouseenter', () => clearTimeout(closeTimer));
            menu.addEventListener('mouseleave', closeMenu);
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = menu.classList.contains('open');
                document.querySelectorAll('.nav-dropdown-menu.open').forEach(m => m.classList.remove('open'));
                document.querySelectorAll('.nav-dropdown-toggle i').forEach(i => i.style.transform = '');
                if (!isOpen) { menu.classList.add('open'); if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = 'rotate(180deg)'; }
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown-menu').forEach(m => m.classList.remove('open'));
            document.querySelectorAll('.nav-dropdown-toggle i').forEach(i => i.style.transform = '');
        }
    });

    function sendToWhatsApp(message) {
        window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    // ── Pricing ────────────────────────────────────────────────────────────────
    const PRICE_PER_MILE = 2;

    const FIXED_ROUTE_PRICES = {
        'cardiff->heathrow':        { saloon: 230, vclass: 250 },
        'cardiff->bristol':         { saloon: 135, vclass: 155 },
        'cardiff->cardiff airport': { saloon: 60,  vclass: 80  },
        'cardiff->gatwick':         { saloon: 320, vclass: 340 }
    };

    const AIRPORT_COORDS = {
        'heathrow':      { lat: 51.4700, lon: -0.4543 },
        'gatwick':       { lat: 51.1537, lon: -0.1821 },
        'stansted':      { lat: 51.8860, lon:  0.2389 },
        'luton':         { lat: 51.8747, lon: -0.3683 },
        'bristol':       { lat: 51.3827, lon: -2.7191 },
        'cardiff airport': { lat: 51.3967, lon: -3.3433 },
        'birmingham':    { lat: 52.4539, lon: -1.7480 },
        'manchester':    { lat: 53.3650, lon: -2.2722 },
        'london city':   { lat: 51.5053, lon:  0.0553 }
    };

    function normalizeLocation(text) {
        if (!text) return null;
        const v = text.trim().toLowerCase();
        if (v.includes('cardiff airport') || v.includes('cwl')) return 'cardiff airport';
        if (v.includes('heathrow'))   return 'heathrow';
        if (v.includes('gatwick'))    return 'gatwick';
        if (v.includes('stansted'))   return 'stansted';
        if (v.includes('luton'))      return 'luton';
        if (v.includes('bristol airport') || v.includes('bristol intl')) return 'bristol';
        if (v.includes('birmingham airport')) return 'birmingham';
        if (v.includes('manchester airport')) return 'manchester';
        if (v.includes('london city airport')) return 'london city';
        if (v.includes('cardiff'))    return 'cardiff';
        return null;
    }

    function getFixedPrice(pickup, dropoff, vehicleType) {
        const from = normalizeLocation(pickup);
        const to   = normalizeLocation(dropoff);
        if (!from || !to || from === to) return null;
        let key = `${from}->${to}`;
        let pricing = FIXED_ROUTE_PRICES[key] || FIXED_ROUTE_PRICES[`${to}->${from}`];
        if (!pricing) return null;
        const type = vehicleType && vehicleType.toLowerCase().includes('v-class') ? 'vclass' : 'saloon';
        return pricing[type] !== undefined ? pricing[type] : Math.min(...Object.values(pricing));
    }

    // ── Geoapify ───────────────────────────────────────────────────────────────

    // Autocomplete suggestions — UK only, house-number level
    async function fetchGeoapifySuggestions(query, signal) {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:gb&format=json&limit=6&apiKey=${GEO_KEY}`;
        const res  = await fetch(url, { signal });
        const data = await res.json();
        return (data.results || []).map(r => ({
            label:  r.formatted,
            lat:    r.lat,
            lon:    r.lon
        }));
    }

    // Geocode a free-text address → { lat, lon }
    async function geocodeAddress(text) {
        const known = normalizeLocation(text);
        if (known && AIRPORT_COORDS[known]) return AIRPORT_COORDS[known];

        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&filter=countrycode:gb&limit=1&apiKey=${GEO_KEY}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.features || !data.features.length) throw new Error('Address not found: ' + text);
        const [lon, lat] = data.features[0].geometry.coordinates;
        return { lat, lon };
    }

    // Reverse geocode lat/lon → full formatted address string
    async function reverseGeocode(lat, lon) {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEO_KEY}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.features || !data.features.length) throw new Error('Reverse geocode failed');
        return data.features[0].properties.formatted;
    }

    // ── Route distance via OSRM ────────────────────────────────────────────────
    async function getDrivingMiles(from, to) {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
        const res  = await fetch(url);
        const data = await res.json();
        if (!data.routes || !data.routes.length) throw new Error('Route not found');
        return Math.ceil(data.routes[0].distance / 1609.344);
    }

    // ── Main fare estimator (called from book.html inline script too) ──────────
    async function calculateRouteEstimate(pickup, dropoff, vehicleType) {
        const [fromCoords, toCoords] = await Promise.all([
            geocodeAddress(pickup),
            geocodeAddress(dropoff)
        ]);
        const miles = await getDrivingMiles(fromCoords, toCoords);
        const fixed = getFixedPrice(pickup, dropoff, vehicleType);
        return {
            miles,
            price: fixed !== null ? fixed : miles * PRICE_PER_MILE,
            fixed: fixed !== null
        };
    }
    window.calculateRouteEstimate = calculateRouteEstimate;

    // ── UI helpers ─────────────────────────────────────────────────────────────
    function setError(el, msg) {
        if (!el) return;
        el.textContent    = msg || '';
        el.style.display  = msg ? 'block' : 'none';
    }

    function buildBookingUrl(pickup, dropoff, estimate) {
        return `book.html?${new URLSearchParams({ pickup, dropoff, distance: estimate.miles, amount: estimate.price.toFixed(2) })}`;
    }

    // ── Autocomplete dropdown ──────────────────────────────────────────────────
    function attachAutocomplete(inputEl) {
        if (!inputEl) return;

        const wrap = inputEl.closest('.location-input-wrap') || inputEl.closest('.autocomplete-wrap') || (() => {
            const w = document.createElement('div');
            w.className = 'autocomplete-wrap';
            w.style.position = 'relative';
            inputEl.parentNode.insertBefore(w, inputEl);
            w.appendChild(inputEl);
            return w;
        })();
        wrap.style.position = 'relative';

        let dropdown = wrap.querySelector('.autocomplete-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'autocomplete-dropdown';
            wrap.appendChild(dropdown);
        }

        let debounceTimer  = null;
        let abortCtrl      = null;
        let results        = [];
        let selectedIndex  = -1;

        function hide() { dropdown.classList.remove('open'); selectedIndex = -1; results = []; }

        function render() {
            if (!results.length) {
                dropdown.innerHTML = '<div class="autocomplete-no-results">No suggestions found</div>';
            } else {
                dropdown.innerHTML = results.map((r, i) => {
                    const parts = r.label.split(',');
                    const main  = parts[0];
                    const sub   = parts.slice(1, 4).join(',').trim();
                    return `<div class="autocomplete-item${i === selectedIndex ? ' active' : ''}" data-index="${i}">
                        ${main}${sub ? `<span class="autocomplete-sub">${sub}</span>` : ''}
                    </div>`;
                }).join('');
                dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
                    el.addEventListener('mousedown', e => {
                        e.preventDefault();
                        const r = results[+el.dataset.index];
                        if (r) { inputEl.value = r.label; inputEl.dispatchEvent(new Event('change', { bubbles: true })); hide(); }
                    });
                });
            }
            dropdown.classList.add('open');
        }

        async function search(q) {
            if (abortCtrl) abortCtrl.abort();
            abortCtrl = new AbortController();
            dropdown.innerHTML = '<div class="autocomplete-loading"><i class="fa-solid fa-spinner fa-spin"></i> Searching…</div>';
            dropdown.classList.add('open');
            try {
                results = await fetchGeoapifySuggestions(q, abortCtrl.signal);
                selectedIndex = -1;
                render();
            } catch (e) {
                if (e.name !== 'AbortError') hide();
            }
        }

        inputEl.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            const v = this.value.trim();
            if (v.length < 3) { hide(); return; }
            debounceTimer = setTimeout(() => search(v), 300);
        });

        inputEl.addEventListener('keydown', function (e) {
            if (!dropdown.classList.contains('open') || !results.length) return;
            if (e.key === 'ArrowDown')  { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, results.length - 1); render(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, -1); render(); }
            else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                inputEl.value = results[selectedIndex].label;
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                hide();
            } else if (e.key === 'Escape') hide();
        });

        inputEl.addEventListener('blur', () => setTimeout(() => { if (!wrap.contains(document.activeElement)) hide(); }, 200));
        document.addEventListener('click', e => { if (!wrap.contains(e.target)) hide(); });
    }

    // ── "Use Current Location" button ─────────────────────────────────────────
    function attachLocationBtn(btnId, inputEl, errorEl) {
        const btn = document.getElementById(btnId);
        if (!btn || !inputEl) return;
        btn.addEventListener('click', () => {
            if (!navigator.geolocation) { setError(errorEl, 'Geolocation is not supported by your browser.'); return; }
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
            btn.disabled  = true;
            navigator.geolocation.getCurrentPosition(
                async ({ coords: { latitude, longitude } }) => {
                    try {
                        inputEl.value = await reverseGeocode(latitude, longitude);
                        setError(errorEl, '');
                        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                    } catch { setError(errorEl, '⚠ Could not get your address. Please enter it manually.'); }
                    finally   { btn.innerHTML = orig; btn.disabled = false; }
                },
                err => {
                    btn.innerHTML = orig; btn.disabled = false;
                    setError(errorEl, err.code === err.PERMISSION_DENIED
                        ? '⚠ Location access denied. Please allow location access and try again.'
                        : '⚠ Unable to detect your location. Please enter your address manually.');
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    }

    // ── Wire up all address fields ─────────────────────────────────────────────
    // Homepage quote
    attachLocationBtn('quoteFromLocBtn', document.getElementById('quoteFrom'), document.getElementById('quoteFromError'));
    attachAutocomplete(document.getElementById('quoteFrom'));
    attachAutocomplete(document.getElementById('quoteTo'));

    // Quote page — instant calculator
    attachLocationBtn('iFromLocBtn', document.getElementById('iFrom'), document.getElementById('iFromError'));
    attachAutocomplete(document.getElementById('iFrom'));
    attachAutocomplete(document.getElementById('iTo'));

    // Quote page — custom quote
    attachAutocomplete(document.getElementById('cFrom'));
    attachAutocomplete(document.getElementById('cTo'));

    // Book page
    attachLocationBtn('bookPickupLocBtn', document.getElementById('bookPickup'), document.getElementById('bookPickupError'));
    attachAutocomplete(document.getElementById('bookPickup'));
    attachAutocomplete(document.getElementById('bookDropoff'));

    // ── Homepage Quote form ────────────────────────────────────────────────────
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', async e => {
            e.preventDefault();
            const pickup  = document.getElementById('quoteFrom').value.trim();
            const dropoff = document.getElementById('quoteTo').value.trim();
            const btn     = quoteForm.querySelector('button[type="submit"]');
            if (!pickup || !dropoff) return;
            try {
                if (btn) { btn.textContent = 'Calculating...'; btn.disabled = true; }
                const est = await calculateRouteEstimate(pickup, dropoff);
                document.getElementById('estimatedPrice').textContent = `£${est.price.toFixed(2)}`;
                const bookNow = document.getElementById('quoteBookNow');
                if (bookNow) bookNow.href = buildBookingUrl(pickup, dropoff, est);
                const result = document.getElementById('quoteResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch { alert('Sorry, we could not calculate that route. Please check your addresses and try again.'); }
            finally   { if (btn) { btn.textContent = 'Calculate Quote'; btn.disabled = false; } }
        });
    }

    // ── Quote page tabs ────────────────────────────────────────────────────────
    document.querySelectorAll('.quote-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.quote-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.quote-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById('tab-' + tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // ── Quote page: instant calculator ────────────────────────────────────────
    const instantForm = document.getElementById('instantQuoteForm');
    if (instantForm) {
        instantForm.addEventListener('submit', async e => {
            e.preventDefault();
            const pickup  = document.getElementById('iFrom').value.trim();
            const dropoff = document.getElementById('iTo').value.trim();
            const btn     = instantForm.querySelector('button[type="submit"]');
            if (!pickup || !dropoff) return;
            try {
                if (btn) { btn.textContent = 'Calculating...'; btn.disabled = true; }
                const est        = await calculateRouteEstimate(pickup, dropoff);
                const isReturn   = document.getElementById('iTripReturn')?.checked;
                const total      = isReturn ? Math.round(est.price * 1.7 * 100) / 100 : est.price;

                document.getElementById('calcPrice').textContent = `£${total.toFixed(2)}`;

                const heading = document.getElementById('instantPriceHeading');
                if (heading) heading.textContent = isReturn ? `Estimated Return Price: £${total.toFixed(2)}` : `Estimated Price: £${total.toFixed(2)}`;

                const breakdown = document.getElementById('instantReturnBreakdown');
                if (breakdown) {
                    if (isReturn) {
                        breakdown.style.display = 'block';
                        breakdown.innerHTML = `One way: £${est.price.toFixed(2)} &bull; Return leg (70%): £${(est.price * 0.7).toFixed(2)}`;
                    } else breakdown.style.display = 'none';
                }

                const bookNow = document.getElementById('instantBookNow');
                if (bookNow) bookNow.href = buildBookingUrl(pickup, dropoff, { miles: est.miles, price: total });
                const result = document.getElementById('instantResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch { alert('Sorry, we could not calculate that route. Please check your addresses and try again.'); }
            finally   { if (btn) { btn.textContent = 'Calculate Estimate'; btn.disabled = false; } }
        });
    }

    // ── Driver Application: WhatsApp summary ──────────────────────────────────
    const driverWABtn = document.getElementById('submitDriverWhatsApp');
    if (driverWABtn) {
        driverWABtn.addEventListener('click', () => {
            const firstName = document.getElementById('drvFirstName')?.value || '';
            const lastName  = document.getElementById('drvLastName')?.value  || '';
            const mobile    = document.getElementById('drvMobile')?.value    || '';
            const email     = document.getElementById('drvEmail')?.value     || '';
            const phdl      = document.getElementById('drvPHDL')?.value      || '';
            const dbs       = document.getElementById('drvDBSStatus')?.value || '';
            const exp       = document.getElementById('drvExperience')?.value || '';
            const notes     = document.getElementById('drvNotes')?.value     || '';
            if (!firstName || !mobile) { alert('Please fill in at least your name and mobile number before sending via WhatsApp.'); return; }
            sendToWhatsApp(
                `*🚗 Driver Application – Aurex Executive Travel*\n\n` +
                `*Name:* ${firstName} ${lastName}\n*Mobile:* ${mobile}\n*Email:* ${email}\n\n` +
                `*Private Hire Licence:* ${phdl}\n*DBS Status:* ${dbs}\n*Experience:* ${exp}\n` +
                (notes ? `*Notes:* ${notes}\n` : '') +
                `\n📎 Full application with documents sent to ${COMPANY_EMAIL}.`
            );
        });
    }

    // ── Vehicle Registration: WhatsApp summary ────────────────────────────────
    const vehicleWABtn = document.getElementById('submitVehicleWhatsApp');
    if (vehicleWABtn) {
        vehicleWABtn.addEventListener('click', () => {
            const reg    = document.getElementById('vehReg')?.value          || '';
            const make   = document.getElementById('vehMake')?.value         || '';
            const model  = document.getElementById('vehModel')?.value        || '';
            const year   = document.getElementById('vehYear')?.value         || '';
            const colour = document.getElementById('vehColour')?.value       || '';
            const name   = document.getElementById('vehDriverName')?.value   || '';
            const mobile = document.getElementById('vehDriverMobile')?.value || '';
            const email  = document.getElementById('vehDriverEmail')?.value  || '';
            const phvl   = document.getElementById('vehPHVL')?.value         || '';
            if (!reg || !name) { alert('Please fill in the registration plate and your name before sending via WhatsApp.'); return; }
            sendToWhatsApp(
                `*🚙 Vehicle Registration – Aurex Executive Travel*\n\n` +
                `*Driver:* ${name}\n*Mobile:* ${mobile}\n*Email:* ${email}\n\n` +
                `*Registration:* ${reg.toUpperCase()}\n*Make/Model:* ${make} ${model}\n*Year:* ${year}\n*Colour:* ${colour}\n` +
                (phvl ? `*PHVL Number:* ${phvl}\n` : '') +
                `\n📎 Full registration with vehicle photos sent to ${COMPANY_EMAIL}.`
            );
        });
    }

    // ── Smooth Scrolling ──────────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                if (navLinks && navLinks.classList.contains('active')) hamburger.click();
            }
        });
    });

    // ── Pre-fill book.html from URL query params ───────────────────────────────
    if (window.location.pathname.includes('book.html')) {
        const p = new URLSearchParams(window.location.search);
        const dropoffField = document.getElementById('bookDropoff');
        if (p.get('route') && dropoffField) dropoffField.value = p.get('route').replace(/\+/g, ' ');
    }
});
