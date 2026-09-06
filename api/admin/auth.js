const supabase = require('../../lib/supabase-admin');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'aurex-admin-secret-change-in-production';

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
  if (sig !== parts[2]) return null;
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.split('/').pop();

  // POST /api/admin/auth — login
  if (req.method === 'POST' && (path === 'auth' || url.pathname.endsWith('/auth'))) {
    try {
      const { email, password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const { data: user, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last_login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      const token = signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.status(200).json({
        token,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // GET /api/admin/auth — verify token
  if (req.method === 'GET' && (path === 'auth' || url.pathname.endsWith('/auth'))) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(authHeader.slice(7));
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(200).json({ user: { id: payload.sub, email: payload.email, role: payload.role } });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

module.exports.signToken = signToken;
module.exports.verifyToken = verifyToken;
