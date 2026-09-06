const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, mobile, email, pickup, dropoff, date, time, passengers, vehicle, price, notes } = body;

    if (!name || !mobile || !pickup || !dropoff) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let customerId = null;
    const { data: existing } = await supabase.from('customers').select('id').eq('mobile', mobile).maybeSingle();
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: c } = await supabase.from('customers').insert({ full_name: name, mobile, email: email || null }).select('id').single();
      customerId = c?.id;
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        customer_id: customerId,
        pickup_address: pickup,
        dropoff_address: dropoff,
        travel_date: date || null,
        travel_time: time || null,
        passengers: parseInt(passengers) || 1,
        vehicle_type: vehicle || null,
        offered_price: price ? parseFloat(price) : null,
        admin_notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, quote_id: quote.id });
  } catch (err) {
    console.error('Submit quote error:', err);
    return res.status(500).json({ error: 'Failed to submit quote' });
  }
};
