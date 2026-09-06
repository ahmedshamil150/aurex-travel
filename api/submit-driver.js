const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { firstName, lastName, mobile, email, phdl, dbsStatus, dbsDate, experience, notes } = body;

    if (!firstName || !lastName || !mobile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create or find customer
    let customerId = null;
    const { data: existing } = await supabase.from('customers').select('id').eq('mobile', mobile).maybeSingle();
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: c } = await supabase.from('customers').insert({ full_name: `${firstName} ${lastName}`, mobile, email: email || null }).select('id').single();
      customerId = c?.id;
    }

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        customer_id: customerId,
        first_name: firstName,
        last_name: lastName,
        mobile,
        email: email || null,
        phdl_number: phdl || null,
        dbs_status: dbsStatus || null,
        dbs_date: dbsDate || null,
        experience_years: experience ? parseInt(experience) : null,
        experience_notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, driver_id: driver.id });
  } catch (err) {
    console.error('Submit driver error:', err);
    return res.status(500).json({ error: 'Failed to submit driver application' });
  }
};
