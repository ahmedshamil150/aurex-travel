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

    // GET all prices
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('fixed_prices').select('*').order('display_order');
      if (error) throw error;
      return res.status(200).json(data);
    }

    // POST new price
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase.from('fixed_prices').insert({
        origin: body.origin.toLowerCase().trim(),
        destination: body.destination.toLowerCase().trim(),
        saloon_price: parseFloat(body.saloon_price),
        mpv_price: parseFloat(body.mpv_price),
        is_active: body.is_active !== false,
        display_order: body.display_order || 0
      }).select().single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Route already exists' });
        throw error;
      }
      return res.status(200).json(data);
    }

    // PATCH update price
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { data, error } = await supabase
        .from('fixed_prices')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE price
    if (req.method === 'DELETE') {
      const priceId = url.searchParams.get('id');
      const { error } = await supabase.from('fixed_prices').delete().eq('id', priceId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Prices API error:', err);
    return res.status(500).json({ error: 'Failed' });
  }
};
