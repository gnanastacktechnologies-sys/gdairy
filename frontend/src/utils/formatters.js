// Format currency in Indian Rupees (₹)
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Format Litres (e.g., "5.75 L")
export const formatLitres = (litres) => {
  const num = Number(litres) || 0;
  return `${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`;
};

// Format Date string (YYYY-MM-DD to DD-MM-YYYY)
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Get today's date string formatted as YYYY-MM-DD
export const getTodayDateString = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
};

// Get date string N days ago (YYYY-MM-DD)
export const getDateNDaysAgo = (n) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  istDate.setDate(istDate.getDate() - n);
  return istDate.toISOString().split('T')[0];
};
