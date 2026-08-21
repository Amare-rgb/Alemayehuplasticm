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

module.exports = {
  setPending,
  getPending,
  deletePending,
  getAllPending
};