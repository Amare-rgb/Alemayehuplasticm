const { getServerSession } = require('../lib/auth');

const requireAuth = async (req, res, next) => {
  const session = await getServerSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.session = session;
  next();
};

const requireAdmin = async (req, res, next) => {
  const session = await getServerSession(req);
  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized - Admin only' });
  }
  req.session = session;
  next();
};

const requireSeller = async (req, res, next) => {
  const session = await getServerSession(req);
  if (!session || (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized - Seller only' });
  }
  req.session = session;
  next();
};

const requireSellerOrAdmin = async (req, res, next) => {
  const session = await getServerSession(req);
  if (!session || (session.user.role !== 'SELLER' && session.user.role !== 'ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized - Seller or Admin required' });
  }
  req.session = session;
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireSeller,
  requireSellerOrAdmin
};