const supabase = require('../lib/supabase-admin');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { driverName, driverMobile, driverEmail, reg, make, model, year, colour, vehicleType, phvl } = body;

    if (!reg || !make || !model || !driverName || !driverMobile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find driver
    let driverId = null;
    const { data: existingDriver } = await supabase.from('drivers').select('id').eq('mobile', driverMobile).maybeSingle();
    if (existingDriver) driverId = existingDriver.id;

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        driver_id: driverId,
        registration: reg.toUpperCase().trim(),
        make,
        model,
        year: year ? parseInt(year) : null,
        colour: colour || null,
        vehicle_type: vehicleType || null,
        phvl_number: phvl || null
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, vehicle_id: vehicle.id });
  } catch (err) {
    console.error('Submit vehicle error:', err);
    return res.status(500).json({ error: 'Failed to submit vehicle registration' });
  }
};
