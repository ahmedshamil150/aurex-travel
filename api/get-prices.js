const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('fixed_prices')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    // Build the same format as the old hardcoded FIXED_ROUTE_PRICES
    const prices = {};
    (data || []).forEach(row => {
      const key = `${row.origin}->${row.destination}`;
      prices[key] = { saloon: row.saloon_price, mpv: row.mpv_price };
    });

    return res.status(200).json(prices);
  } catch (err) {
    console.error('Get prices error:', err);
    return res.status(500).json({ error: 'Failed to load prices' });
  }
};
