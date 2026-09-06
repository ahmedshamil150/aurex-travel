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

    // GET single booking
    if (req.method === 'GET' && id) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, customers(*), drivers(*), vehicles(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // GET list bookings
    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '25');
      const offset = (page - 1) * limit;

      let query = supabase.from('bookings').select('*, customers(full_name, mobile, email)', { count: 'exact' });
      if (status && status !== 'all') query = query.eq('status', status);
      if (search) {
        query = query.or(`pickup_address.ilike.%${search}%,dropoff_address.ilike.%${search}%,customers.full_name.ilike.%${search}%`);
      }
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json({ data, total: count, page, limit });
    }

    // PATCH update booking
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase
        .from('bookings')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE booking (soft delete by setting status to cancelled)
    if (req.method === 'DELETE') {
      const bookingId = url.searchParams.get('id');
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Bookings API error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
};
