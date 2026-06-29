const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { amount, pickup, dropoff, date, time, vehicle, name } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Invalid amount provided.' });
    }

    // Convert amount to pence (e.g., 230.50 -> 23050)
    const unitAmount = Math.round(parseFloat(amount) * 100);

    const description = `Transfer: ${pickup} to ${dropoff} on ${date} at ${time}. Vehicle: ${vehicle}. Passenger: ${name || 'N/A'}`;

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Aurex Executive Travel Booking',
              description: description.substring(0, 400),
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/book.html?payment=success`,
      cancel_url: `${origin}/book.html?payment=cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Error creating checkout session', details: err.message });
  }
};
