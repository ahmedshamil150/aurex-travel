const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, mobile, email, pickup, dropoff, date, time, flight, tripType, vehicle, passengers, estimatedPrice, distance } = body;

    if (!name || !mobile || !pickup || !dropoff || !date || !vehicle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find or create customer
    let customerId = null;
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile', mobile)
      .maybeSingle();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({ full_name: name, mobile, email: email || null })
        .select('id')
        .single();
      customerId = newCustomer?.id;
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        pickup_address: pickup,
        pickup_lat: body.pickupLat ? parseFloat(body.pickupLat) : null,
        pickup_lon: body.pickupLon ? parseFloat(body.pickupLon) : null,
        dropoff_address: dropoff,
        dropoff_lat: body.dropoffLat ? parseFloat(body.dropoffLat) : null,
        dropoff_lon: body.dropoffLon ? parseFloat(body.dropoffLon) : null,
        travel_date: date,
        travel_time: time || null,
        flight_number: flight || null,
        trip_type: tripType || 'one_way',
        vehicle_type: vehicle.toLowerCase().includes('mpv') ? 'mpv' : 'saloon',
        passengers: parseInt(passengers) || 1,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        distance_miles: distance ? parseInt(distance) : null,
        status: 'pending',
        customer_notes: body.notes || null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, booking_id: booking.id });
  } catch (err) {
    console.error('Submit booking error:', err);
    return res.status(500).json({ error: 'Failed to submit booking' });
  }
};
