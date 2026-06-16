document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('bookingModal');
    const bookBtns = [
        document.getElementById('bookNowBtn'),
        document.getElementById('footerGetQuote'),
        document.getElementById('footerBookOnline')
    ];
    
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('bookingForm');

    // Open modal for all booking buttons
    bookBtns.forEach(btn => {
        if (btn) {
            btn.onclick = function (e) {
                e.preventDefault();
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        }
    });

    // Close modal
    span.onclick = function () {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Close when clicking outside
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Handle form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Gather form data
        const data = {
            fullName: document.getElementById('fullName').value,
            mobile: document.getElementById('mobile').value,
            email: document.getElementById('email').value,
            pickup: document.getElementById('pickup').value,
            dropoff: document.getElementById('dropoff').value,
            flightNumber: document.getElementById('flightNumber').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            passengers: document.getElementById('passengers').value,
            suitcases: document.getElementById('suitcases').value,
            vehicle: document.getElementById('vehicle').value,
            returnJourney: document.getElementById('returnJourney').value,
            offeredPrice: document.getElementById('offeredPrice').value,
            notes: document.getElementById('notes').value
        };

        // Format message for WhatsApp
        let message = `*New Booking Request - Aurex Executive Travel*\n\n`;
        message += `*Name:* ${data.fullName}\n`;
        message += `*Mobile:* ${data.mobile}\n`;
        message += `*Email:* ${data.email}\n`;
        message += `*Pickup:* ${data.pickup}\n`;
        message += `*Drop-off:* ${data.dropoff}\n`;

        if (data.flightNumber) {
            message += `*Flight No:* ${data.flightNumber}\n`;
        }

        message += `*Date:* ${data.date}\n`;
        message += `*Time:* ${data.time}\n`;
        message += `*Passengers:* ${data.passengers}\n`;
        message += `*Suitcases:* ${data.suitcases}\n`;
        message += `*Vehicle:* ${data.vehicle}\n`;
        message += `*Return Journey:* ${data.returnJourney}\n`;
        message += `*Offered Price:* £${data.offeredPrice}\n`;

        if (data.notes) {
            message += `*Notes:* ${data.notes}\n`;
        }

        // WhatsApp number of the company
        const whatsappNumber = '923325308087';

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Create WhatsApp link
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        // Redirect to WhatsApp
        window.open(whatsappUrl, '_blank');

        // Close modal after submission
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        form.reset();
    });

    // Mobile menu toggle logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
                navLinks.style.padding = '20px 0';
                navLinks.style.borderBottom = '1px solid #333';
            }
        });
    }
});
