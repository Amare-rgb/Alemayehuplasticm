// In-memory store for pending verifications
const pendingVerifications = new Map();

const setPending = (email, data) => {
  pendingVerifications.set(email, data);
};

const getPending = (email) => {
  return pendingVerifications.get(email);
};

const deletePending = (email) => {
  pendingVerifications.delete(email);
};

const getAllPending = () => {
  return Array.from(pendingVerifications.entries()).map(([email, data]) => ({
    email,
    ...data
  }));
};

// Clean up expired verifications (older than 24 hours)
const cleanupExpired = () => {
  const now = Date.now();
  const expired = [];
  
  for (const [email, data] of pendingVerifications.entries()) {
    if (now - data.createdAt > 24 * 60 * 60 * 1000) { // 24 hours
      expired.push(email);
    }
  }
  
  expired.forEach(email => pendingVerifications.delete(email));
  return expired.length;
};

// Run cleanup every hour
setInterval(cleanupExpired, 60 * 60 * 1000);

module.exports = {
  setPending,
  getPending,
  deletePending,
  getAllPending,
  cleanupExpired
};