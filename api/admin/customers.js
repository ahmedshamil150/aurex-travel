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

    if (req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '25');
      const search = url.searchParams.get('search');
      const offset = (page - 1) * limit;

      let query = supabase.from('customers').select('*', { count: 'exact' });
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`);
      }
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return res.status(200).json({ data, total: count, page, limit });
    }

    // GET customer with their bookings/quotes
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (id) {
        const { data, error } = await supabase
          .from('customers')
          .select('*, bookings(*), quotes(*)')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Customers API error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
};
