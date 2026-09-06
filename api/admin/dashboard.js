const supabase = require('../../lib/supabase-admin');
const { verifyToken } = require('./auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function auth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalBookings, pendingBookings, thisMonthBookings, thisWeekBookings,
           pendingQuotes, activeDrivers, activeVehicles, unreadMessages,
           recentBookings, upcomingBookings, revenue, bookingsByStatus] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }).in('status', ['approved', 'active']),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'unread'),
      supabase.from('bookings').select('*, customers(full_name, mobile)').order('created_at', { ascending: false }).limit(10),
      supabase.from('bookings').select('*, customers(full_name, mobile)').gte('travel_date', new Date().toISOString().split('T')[0]).lte('travel_date', sevenDaysAhead.split('T')[0]).order('travel_date').limit(10),
      supabase.from('bookings').select('final_price').eq('payment_status', 'paid'),
      supabase.from('bookings').select('status')
    ]);

    const totalRevenue = (revenue.data || []).reduce((sum, b) => sum + (parseFloat(b.final_price) || 0), 0);

    const statusCounts = {};
    (bookingsByStatus.data || []).forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });

    return res.status(200).json({
      stats: {
        total_bookings: totalBookings.count || 0,
        pending_bookings: pendingBookings.count || 0,
        this_month_bookings: thisMonthBookings.count || 0,
        this_week_bookings: thisWeekBookings.count || 0,
        pending_quotes: pendingQuotes.count || 0,
        active_drivers: activeDrivers.count || 0,
        active_vehicles: activeVehicles.count || 0,
        unread_messages: unreadMessages.count || 0,
        total_revenue: totalRevenue,
        bookings_by_status: statusCounts
      },
      recent_bookings: recentBookings.data || [],
      upcoming_bookings: upcomingBookings.data || []
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
};
