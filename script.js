document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('bookingModal');
    const btn = document.getElementById('bookNowBtn');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('bookingForm');

    // Open modal
    btn.onclick = function () {
        modal.style.display = 'block';
    }

    // Close modal
    span.onclick = function () {
        modal.style.display = 'none';
    }

    // Close when clicking outside
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
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
        let message = `*New Booking Request*\n\n`;
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

        // WhatsApp number of the company (replace with actual number)
        const whatsappNumber = '447000000000'; // Example UK format without +

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Create WhatsApp link
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        // Redirect to WhatsApp
        window.location.href = whatsappUrl;

        // Close modal after submission
        modal.style.display = 'none';
        form.reset();
    });
});
