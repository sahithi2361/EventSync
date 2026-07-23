export type EmailError = 'required' | 'format' | 'domain' | null;

export function validateEmailDomain(email: string): EmailError {
  const trimmed = email.trim();
  if (!trimmed) return 'required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'format';
  if (!trimmed.toLowerCase().endsWith('@srkrec.ac.in')) return 'domain';
  return null;
}

export function emailErrorMessage(error: EmailError): string {
  switch (error) {
    case 'required':
      return 'Email is required.';
    case 'format':
      return 'Please enter a valid email address.';
    case 'domain':
      return 'Invalid email. Please use your SRKR college email address (@srkrec.ac.in).';
    default:
      return '';
  }
}
