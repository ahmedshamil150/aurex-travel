const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, email, phone, company, journeys, requirements } = body;

    if (!name || !phone || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let customerId = null;
    const { data: existing } = await supabase.from('customers').select('id').eq('mobile', phone).maybeSingle();
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: c } = await supabase.from('customers').insert({ full_name: name, mobile: phone, email: email || null, company }).select('id').single();
      customerId = c?.id;
    }

    const { error } = await supabase
      .from('corporate_enquiries')
      .insert({
        customer_id: customerId,
        company_name: company,
        journeys_per_month: journeys ? parseInt(journeys) : null,
        requirements: requirements || null
      });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submit corporate error:', err);
    return res.status(500).json({ error: 'Failed to submit enquiry' });
  }
};
