document.addEventListener('DOMContentLoaded', () => {
    const WA_NUMBER = '447905298692';
    const COMPANY_EMAIL = 'info@aurexexecutivetravel.com';

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

    // --- Homepage Instant Quote Calculator ---
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const miles = parseFloat(document.getElementById('quoteMiles').value);
            if (!isNaN(miles) && miles > 0) {
                const price = miles * 2;
                document.getElementById('estimatedDistance').textContent = miles;
                document.getElementById('estimatedPrice').textContent = `£${price.toFixed(2)}`;
                const result = document.getElementById('quoteResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        instantForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const miles = parseFloat(document.getElementById('iMiles').value);
            if (!isNaN(miles) && miles > 0) {
                const price = miles * 2;
                document.getElementById('calcMiles').textContent = miles;
                document.getElementById('calcPrice').textContent = `£${price.toFixed(2)}`;
                const result = document.getElementById('instantResult');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // --- Quote Page: Custom Quote Form → WhatsApp ---
    const customQuoteForm = document.getElementById('customQuoteForm');
    if (customQuoteForm) {
        customQuoteForm.addEventListener('submit', (e) => {
            return;
            e.preventDefault();
            const f = customQuoteForm;
            const message =
                `*Quote Request – Aurex Executive Travel*\n\n` +
                `*Name:* ${f.name.value}\n` +
                `*Mobile:* ${f.mobile.value}\n\n` +
                `*Pickup:* ${f.pickup.value}\n` +
                `*Drop-off:* ${f.dropoff.value}\n` +
                `*Date:* ${f.date.value}\n` +
                `*Time:* ${f.time.value}\n` +
                `*Passengers:* ${f.passengers.value}\n` +
                `*Vehicle:* ${f.vehicle.value}\n` +
                (f.offeredPrice.value ? `*Offered Price:* £${f.offeredPrice.value}\n` : '') +
                (f.notes.value ? `*Notes:* ${f.notes.value}\n` : '') +
                `\nPlease confirm availability and provide a fixed price.`;
            sendToWhatsApp(message);
        });
    }

    // --- Book Online Form → WhatsApp ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            return;
            e.preventDefault();
            const f = bookingForm;
            const message =
                `*Booking Request – Aurex Executive Travel*\n\n` +
                `*Name:* ${f.name.value}\n` +
                `*Mobile:* ${f.mobile.value}\n` +
                `*Email:* ${f.email.value}\n\n` +
                `*Pickup:* ${f.pickup.value}\n` +
                `*Drop-off:* ${f.dropoff.value}\n` +
                `*Airport:* ${f.airport.value || 'N/A'}\n` +
                `*Flight Number:* ${f.flight.value || 'N/A'}\n` +
                `*Date:* ${f.date.value}\n` +
                `*Time:* ${f.time.value}\n` +
                `*Return Journey:* ${f.return.value}\n` +
                `*Passengers:* ${f.passengers.value}\n` +
                `*Suitcases:* ${f.suitcases.value}\n` +
                `*Vehicle:* ${f.vehicle.value}\n` +
                (f.offeredPrice.value ? `*Offered Price:* £${f.offeredPrice.value}\n` : '') +
                (f.notes.value ? `*Notes:* ${f.notes.value}\n` : '') +
                `\nPlease confirm this booking and send a payment link.`;
            sendToWhatsApp(message);
        });
    }

    // --- Corporate Enquiry Form → WhatsApp ---
    const corporateForm = document.getElementById('corporateForm');
    if (corporateForm) {
        corporateForm.addEventListener('submit', (e) => {
            return;
            e.preventDefault();
            const f = corporateForm;
            const message =
                `*Corporate Account Enquiry – Aurex Executive Travel*\n\n` +
                `*Name:* ${f.name.value}\n` +
                `*Company:* ${f.company.value}\n` +
                `*Email:* ${f.email.value}\n` +
                `*Phone:* ${f.phone.value}\n` +
                `*Journeys/Month:* ${f.journeys.value || 'Not specified'}\n` +
                (f.message.value ? `*Requirements:* ${f.message.value}\n` : '') +
                `\nPlease get in touch to discuss a corporate account.`;
            sendToWhatsApp(message);
        });
    }

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

    // --- Driver Application form submit confirmation ---
    const driverAppForm = document.getElementById('driverApplicationForm');
    if (driverAppForm) {
        driverAppForm.addEventListener('submit', (e) => {
            // Formspree handles the actual submission.
            // We show a brief confirmation message after submit.
            // The default Formspree redirect handles the thank-you page.
            const btn = document.getElementById('submitDriverForm');
            if (btn) {
                btn.textContent = 'Submitting...';
                btn.disabled = true;
            }
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

    // --- Vehicle Registration form submit confirmation ---
    const vehicleRegForm = document.getElementById('vehicleRegistrationForm');
    if (vehicleRegForm) {
        vehicleRegForm.addEventListener('submit', () => {
            const btn = document.getElementById('submitVehicleForm');
            if (btn) {
                btn.textContent = 'Submitting...';
                btn.disabled = true;
            }
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
        const vehicleField = document.getElementById('bookVehicle');
        if (params.get('route') && dropoffField) {
            dropoffField.value = params.get('route').replace(/\+/g, ' ');
        }
        if (params.get('vehicle') && vehicleField) {
            vehicleField.value = params.get('vehicle');
        }
    }
});
