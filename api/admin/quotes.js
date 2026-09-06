const supabase = require('../../lib/supabase-admin');
const { verifyToken } = require('./auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function auth(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return verifyToken(h.slice(7));
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (req.method === 'GET' && id) {
      const { data, error } = await supabase.from('quotes').select('*, customers(*)').eq('id', id).single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '25');
      const offset = (page - 1) * limit;

      let query = supabase.from('quotes').select('*, customers(full_name, mobile, email)', { count: 'exact' });
      if (status && status !== 'all') query = query.eq('status', status);
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json({ data, total: count, page, limit });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase
        .from('quotes')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // Convert quote to booking
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body.action === 'convert_to_booking') {
        const { quote_id } = body;
        const { data: quote, error: qErr } = await supabase.from('quotes').select('*').eq('id', quote_id).single();
        if (qErr) throw qErr;

        const { data: booking, error: bErr } = await supabase.from('bookings').insert({
          customer_id: quote.customer_id,
          pickup_address: quote.pickup_address,
          dropoff_address: quote.dropoff_address,
          travel_date: quote.travel_date,
          travel_time: quote.travel_time,
          passengers: quote.passengers,
          vehicle_type: quote.vehicle_type,
          final_price: quote.our_price,
          status: 'pending'
        }).select().single();
        if (bErr) throw bErr;

        await supabase.from('quotes').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', quote_id);
        return res.status(200).json(booking);
      }
    }

    if (req.method === 'DELETE') {
      const quoteId = url.searchParams.get('id');
      const { error } = await supabase.from('quotes').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', quoteId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Quotes API error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
};
