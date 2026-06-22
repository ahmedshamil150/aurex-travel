document.addEventListener('DOMContentLoaded', () => {
    const WA_NUMBER = '447905298692';
    const COMPANY_EMAIL = 'nayyer.zaman@gmail.com';

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

    // --- Desktop Dropdown (Drive With Us) ---
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const menu   = dropdown.querySelector('.nav-dropdown-menu');
        let closeTimer = null;

        function openMenu() {
            clearTimeout(closeTimer);
            menu.classList.add('open');
            if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = 'rotate(180deg)';
        }

        function closeMenu() {
            closeTimer = setTimeout(() => {
                menu.classList.remove('open');
                if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = '';
            }, 150); // 150ms grace period — enough to move cursor from toggle into menu
        }

        if (toggle && menu) {
            // Desktop: hover on the whole dropdown li (includes the bridge ::after)
            dropdown.addEventListener('mouseenter', openMenu);
            dropdown.addEventListener('mouseleave', closeMenu);
            // Keep open when cursor is inside the menu itself
            menu.addEventListener('mouseenter', () => clearTimeout(closeTimer));
            menu.addEventListener('mouseleave', closeMenu);

            // Mobile: click toggle
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = menu.classList.contains('open');
                // Close any other open dropdowns first
                document.querySelectorAll('.nav-dropdown-menu.open').forEach(m => m.classList.remove('open'));
                document.querySelectorAll('.nav-dropdown-toggle i').forEach(i => i.style.transform = '');
                if (!isOpen) {
                    menu.classList.add('open');
                    if (toggle.querySelector('i')) toggle.querySelector('i').style.transform = 'rotate(180deg)';
                }
            });
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown-menu').forEach(m => m.classList.remove('open'));
            document.querySelectorAll('.nav-dropdown-toggle i').forEach(i => i.style.transform = '');
        }
    });

    function sendToWhatsApp(message) {
        window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    const PRICE_PER_MILE = 2;
    const AIRPORT_COORDS = {
        heathrow: { lat: 51.4700, lon: -0.4543 },
        gatwick: { lat: 51.1537, lon: -0.1821 },
        stansted: { lat: 51.8860, lon: 0.2389 },
        luton: { lat: 51.8747, lon: -0.3683 },
        bristol: { lat: 51.3827, lon: -2.7191 },
        cardiff: { lat: 51.3967, lon: -3.3433 },
        birmingham: { lat: 52.4539, lon: -1.7480 },
        manchester: { lat: 53.3650, lon: -2.2722 },
        'london city': { lat: 51.5053, lon: 0.0553 }
    };

    // --- UK Postcode regex ---
    const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2})$/i;

    function isUKPostcode(str) {
        return UK_POSTCODE_REGEX.test(str.trim());
    }

    // Lookup a UK postcode → { lat, lon, address } via postcodes.io
    async function lookupPostcode(postcode) {
        const clean = postcode.trim().toUpperCase().replace(/\s+/g, '');
        const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== 200) throw new Error('Invalid UK postcode');
        const r = data.result;
        return {
            lat: r.latitude,
            lon: r.longitude,
            address: `${r.parish !== r.admin_district ? r.parish + ', ' : ''}${r.admin_district}, ${r.admin_county || r.region}, UK`
        };
    }

    function knownAirport(location) {
        const value = location.toLowerCase();
        return Object.keys(AIRPORT_COORDS).find(key => value.includes(key));
    }

    // Reverse geocode lat/lon → UK address string via Nominatim
    async function reverseGeocodeUK(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data || !data.address) throw new Error('Could not get address');
        const addr = data.address;
        // Validate it's in UK
        if (addr.country_code !== 'gb') throw new Error('outside_uk');
        // Build a readable address
        const parts = [
            addr.road || addr.pedestrian || addr.path,
            addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district,
            addr.city || addr.town || addr.county,
            addr.postcode
        ].filter(Boolean);
        return parts.join(', ');
    }

    // Validate that a geocoded result is within UK bounding box
    function isWithinUK(lat, lon) {
        return lat >= 49.8 && lat <= 60.9 && lon >= -8.7 && lon <= 1.8;
    }

    async function geocodeLocation(location) {
        const trimmed = location.trim();

        // 1. Check known airports first
        const airportKey = knownAirport(trimmed);
        if (airportKey) return AIRPORT_COORDS[airportKey];

        // 2. If it looks like a UK postcode, use postcodes.io
        if (isUKPostcode(trimmed)) {
            const result = await lookupPostcode(trimmed);
            return { lat: result.lat, lon: result.lon };
        }

        // 3. Otherwise use Nominatim restricted to GB
        const query = trimmed.toLowerCase().includes('uk') ? trimmed : `${trimmed}, UK`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const results = await response.json();
        if (!results.length) throw new Error('outside_uk');
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        if (!isWithinUK(lat, lon)) throw new Error('outside_uk');
        return { lat, lon };
    }

    async function calculateRouteEstimate(pickup, dropoff) {
        const [from, to] = await Promise.all([
            geocodeLocation(pickup),
            geocodeLocation(dropoff)
        ]);
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
        const response = await fetch(routeUrl);
        const data = await response.json();
        if (!data.routes || !data.routes.length) throw new Error('Route not found');

        const miles = Math.ceil(data.routes[0].distance / 1609.344);
        return {
            miles,
            price: miles * PRICE_PER_MILE
        };
    }

    function buildBookingUrl(pickup, dropoff, estimate) {
        const params = new URLSearchParams({
            pickup,
            dropoff,
            distance: estimate.miles,
            amount: estimate.price.toFixed(2)
        });
        return `book.html?${params.toString()}`;
    }

    window.calculateRouteEstimate = calculateRouteEstimate;

    // --- Helper: show/clear location error ---
    function setLocationError(errorEl, msg) {
        if (!errorEl) return;
        errorEl.textContent = msg || '';
        errorEl.style.display = msg ? 'block' : 'none';
    }

    // --- "Use Current Location" button handler ---
    function attachLocationBtn(btnId, inputEl, errorEl) {
        const btn = document.getElementById(btnId);
        if (!btn || !inputEl) return;

        btn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                setLocationError(errorEl, 'Geolocation is not supported by your browser.');
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
            btn.disabled = true;

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        if (!isWithinUK(latitude, longitude)) {
                            setLocationError(errorEl, '⚠ Your current location appears to be outside the UK. Please enter a UK address manually.');
                            btn.innerHTML = originalHtml;
                            btn.disabled = false;
                            return;
                        }
                        const address = await reverseGeocodeUK(latitude, longitude);
                        inputEl.value = address;
                        setLocationError(errorEl, '');
                    } catch (err) {
                        if (err.message === 'outside_uk') {
                            setLocationError(errorEl, '⚠ Your current location appears to be outside the UK. Please enter a UK address manually.');
                        } else {
                            setLocationError(errorEl, '⚠ Could not determine your address. Please enter it manually.');
                        }
                    } finally {
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    }
                },
                (err) => {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                    if (err.code === err.PERMISSION_DENIED) {
                        setLocationError(errorEl, '⚠ Location access denied. Please allow location access in your browser and try again.');
                    } else {
                        setLocationError(errorEl, '⚠ Unable to detect your location. Please enter your address manually.');
                    }
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    }

    // --- Postcode detection on input blur ---
    function attachPostcodeAutofill(inputEl, errorEl) {
        if (!inputEl) return;
        inputEl.addEventListener('blur', async () => {
            const val = inputEl.value.trim();
            if (!val || !isUKPostcode(val)) return;
            try {
                const result = await lookupPostcode(val);
                // Only update if the user hasn't changed the field
                if (inputEl.value.trim().toUpperCase().replace(/\s+/g, '') === val.toUpperCase().replace(/\s+/g, '')) {
                    inputEl.value = result.address;
                    setLocationError(errorEl, '');
                }
            } catch (e) {
                setLocationError(errorEl, '⚠ Invalid UK postcode. Please check and try again.');
            }
        });
    }

    // --- Wire up location buttons for each page ---
    // Quote page
    const iFromInput  = document.getElementById('iFrom');
    const iToInput    = document.getElementById('iTo');
    const iFromError  = document.getElementById('iFromError');
    const iToError    = document.getElementById('iToError');
    attachLocationBtn('iFromLocBtn', iFromInput, iFromError);
    attachPostcodeAutofill(iFromInput, iFromError);
    attachPostcodeAutofill(iToInput, iToError);

    // Homepage quote
    const quoteFromInput = document.getElementById('quoteFrom');
    const quoteToInput   = document.getElementById('quoteTo');
    const quoteFromError = document.getElementById('quoteFromError');
    const quoteToError   = document.getElementById('quoteToError');
    attachLocationBtn('quoteFromLocBtn', quoteFromInput, quoteFromError);
    attachPostcodeAutofill(quoteFromInput, quoteFromError);
    attachPostcodeAutofill(quoteToInput, quoteToError);

    // Book page
    const bookPickupInput  = document.getElementById('bookPickup');
    const bookDropoffInput = document.getElementById('bookDropoff');
    const bookPickupError  = document.getElementById('bookPickupError');
    const bookDropoffError = document.getElementById('bookDropoffError');
    attachLocationBtn('bookPickupLocBtn', bookPickupInput, bookPickupError);
    attachPostcodeAutofill(bookPickupInput, bookPickupError);
    attachPostcodeAutofill(bookDropoffInput, bookDropoffError);

    // --- Homepage Instant Quote Calculator ---
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pickup = document.getElementById('quoteFrom').value.trim();
            const dropoff = document.getElementById('quoteTo').value.trim();
            const btn = quoteForm.querySelector('button[type="submit"]');
            if (!pickup || !dropoff) return;

            try {
                if (btn) {
                    btn.textContent = 'Calculating...';
                    btn.disabled = true;
                }
                const estimate = await calculateRouteEstimate(pickup, dropoff);
                document.getElementById('estimatedDistance').textContent = estimate.miles;
                document.getElementById('estimatedPrice').textContent = `£${estimate.price.toFixed(2)}`;
                const bookNow = document.getElementById('quoteBookNow');
                if (bookNow) bookNow.href = buildBookingUrl(pickup, dropoff, estimate);
                const result = document.getElementById('quoteResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch (error) {
                const msg = error.message === 'outside_uk'
                    ? 'One or more locations could not be found in the UK. Please enter a valid UK address or postcode.'
                    : 'Sorry, we could not calculate that route. Please check the pickup and drop-off locations and try again.';
                alert(msg);
            } finally {
                if (btn) {
                    btn.textContent = 'Calculate Quote';
                    btn.disabled = false;
                }
            }
        });

    }

    // --- Quote Page: Tab Switching ---
    const tabs = document.querySelectorAll('.quote-tab');
    const tabContents = document.querySelectorAll('.quote-tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById('tab-' + tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // --- Quote Page: Instant Calculator ---
    const instantForm = document.getElementById('instantQuoteForm');
    if (instantForm) {
        instantForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pickup = document.getElementById('iFrom').value.trim();
            const dropoff = document.getElementById('iTo').value.trim();
            const btn = instantForm.querySelector('button[type="submit"]');
            if (!pickup || !dropoff) return;

            try {
                if (btn) {
                    btn.textContent = 'Calculating...';
                    btn.disabled = true;
                }
                const estimate = await calculateRouteEstimate(pickup, dropoff);
                document.getElementById('calcPrice').textContent = `£${estimate.price.toFixed(2)}`;
                const bookNow = document.getElementById('instantBookNow');
                if (bookNow) bookNow.href = buildBookingUrl(pickup, dropoff, estimate);
                const result = document.getElementById('instantResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch (error) {
                const msg = error.message === 'outside_uk'
                    ? 'One or more locations could not be found in the UK. Please enter a valid UK address or postcode.'
                    : 'Sorry, we could not calculate that route. Please check the pickup and drop-off locations and try again.';
                alert(msg);
            } finally {
                if (btn) {
                    btn.textContent = 'Calculate Estimate';
                    btn.disabled = false;
                }
            }
        });
    }

    // --- Quote Page: Custom Quote Form → We use FormSubmit (email) + redirect to success ---

    // --- Book Online Form: We use FormSubmit (email) + localStorage to show PayPal panel ---

    // --- Corporate Enquiry Form → Let's set it up to use FormSubmit + redirect to success ---

    // --- Driver Application: WhatsApp summary button ---
    const driverWABtn = document.getElementById('submitDriverWhatsApp');
    if (driverWABtn) {
        driverWABtn.addEventListener('click', () => {
            const f = document.getElementById('driverApplicationForm');
            if (!f) return;

            const firstName = document.getElementById('drvFirstName')?.value || '';
            const lastName  = document.getElementById('drvLastName')?.value  || '';
            const mobile    = document.getElementById('drvMobile')?.value    || '';
            const email     = document.getElementById('drvEmail')?.value     || '';
            const phdl      = document.getElementById('drvPHDL')?.value      || '';
            const dbs       = document.getElementById('drvDBSStatus')?.value || '';
            const exp       = document.getElementById('drvExperience')?.value || '';
            const notes     = document.getElementById('drvNotes')?.value     || '';

            if (!firstName || !mobile) {
                alert('Please fill in at least your name and mobile number before sending via WhatsApp.');
                return;
            }

            const message =
                `*🚗 Driver Application – Aurex Executive Travel*\n\n` +
                `*Name:* ${firstName} ${lastName}\n` +
                `*Mobile:* ${mobile}\n` +
                `*Email:* ${email}\n\n` +
                `*Private Hire Licence:* ${phdl}\n` +
                `*DBS Status:* ${dbs}\n` +
                `*Experience:* ${exp}\n` +
                (notes ? `*Notes:* ${notes}\n` : '') +
                `\n📎 Full application with documents sent to ${COMPANY_EMAIL}.\nPlease review and confirm next steps.`;

            sendToWhatsApp(message);
        });
    }

    // --- Vehicle Registration: WhatsApp summary button ---
    const vehicleWABtn = document.getElementById('submitVehicleWhatsApp');
    if (vehicleWABtn) {
        vehicleWABtn.addEventListener('click', () => {
            const reg     = document.getElementById('vehReg')?.value     || '';
            const make    = document.getElementById('vehMake')?.value    || '';
            const model   = document.getElementById('vehModel')?.value   || '';
            const year    = document.getElementById('vehYear')?.value    || '';
            const colour  = document.getElementById('vehColour')?.value  || '';
            const name    = document.getElementById('vehDriverName')?.value   || '';
            const mobile  = document.getElementById('vehDriverMobile')?.value || '';
            const email   = document.getElementById('vehDriverEmail')?.value  || '';
            const phvl    = document.getElementById('vehPHVL')?.value    || '';

            if (!reg || !name) {
                alert('Please fill in the registration plate and your name before sending via WhatsApp.');
                return;
            }

            const message =
                `*🚙 Vehicle Registration – Aurex Executive Travel*\n\n` +
                `*Driver:* ${name}\n` +
                `*Mobile:* ${mobile}\n` +
                `*Email:* ${email}\n\n` +
                `*Registration:* ${reg.toUpperCase()}\n` +
                `*Make/Model:* ${make} ${model}\n` +
                `*Year:* ${year}\n` +
                `*Colour:* ${colour}\n` +
                (phvl ? `*PHVL Number:* ${phvl}\n` : '') +
                `\n📎 Full registration with vehicle photos sent to ${COMPANY_EMAIL}.\nPlease review and confirm.`;

            sendToWhatsApp(message);
        });
    }

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                if (navLinks && navLinks.classList.contains('active')) {
                    hamburger.click();
                }
            }
        });
    });

    // --- Pre-fill book.html from URL query params ---
    if (window.location.pathname.includes('book.html')) {
        const params = new URLSearchParams(window.location.search);
        const dropoffField = document.getElementById('bookDropoff');
        if (params.get('route') && dropoffField) {
            dropoffField.value = params.get('route').replace(/\+/g, ' ');
        }
    }

    // --- Ensure Formsubmit forms always POST ---
    const formsubmitForms = document.querySelectorAll('form[action^="https://formsubmit.co"]');
    formsubmitForms.forEach(form => {
        // Exclude booking form because it has custom localStorage handling
        if (form.id === 'bookingForm') return;
        
        form.setAttribute('method', 'POST');
        form.method = 'POST';
    });
});
