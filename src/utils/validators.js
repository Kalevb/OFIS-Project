// Form validation helpers

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  return clean.length === 9 || clean.length === 10;
}

export function isValidNationalId(id) {
  const clean = id.replace(/\D/g, '');
  if (clean.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseFloat(clean.charAt(i)) * (13 - i);
  }
  return (11 - (sum % 11)) % 10 === parseFloat(clean.charAt(12));
}
