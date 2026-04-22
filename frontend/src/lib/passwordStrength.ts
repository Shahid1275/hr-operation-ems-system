export type PasswordStrength = {
  label: string;
  width: string;
  color: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: 'Weak', width: '25%', color: 'bg-red-500' };
  if (score === 2) return { label: 'Fair', width: '50%', color: 'bg-amber-500' };
  if (score === 3) return { label: 'Good', width: '75%', color: 'bg-blue-500' };
  return { label: 'Strong', width: '100%', color: 'bg-green-500' };
}
