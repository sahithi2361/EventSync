export interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

export const passwordChecks: PasswordCheck[] = [
  { label: 'Minimum 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'At least 1 uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least 1 lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least 1 number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'At least 1 special character (@ $ ! % * ? & # ^)', test: (pw) => /[@$!%*?&#^]/.test(pw) },
];

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordValidation {
  results: boolean[];
  score: number;
  isStrong: boolean;
  level: StrengthLevel;
  levelLabel: string;
  levelColor: string;
  barColor: string;
}

export function validatePassword(pw: string): PasswordValidation {
  const results = passwordChecks.map((c) => c.test(pw));
  const score = results.filter(Boolean).length;
  const isStrong = score === passwordChecks.length;

  let level: StrengthLevel = 'weak';
  if (score >= 5) level = 'strong';
  else if (score >= 4) level = 'good';
  else if (score >= 2) level = 'fair';
  else level = 'weak';

  const levelMap: Record<StrengthLevel, { label: string; color: string; bar: string }> = {
    weak: { label: 'Weak', color: 'text-red-500', bar: 'bg-red-500' },
    fair: { label: 'Fair', color: 'text-orange-500', bar: 'bg-orange-500' },
    good: { label: 'Good', color: 'text-yellow-500', bar: 'bg-yellow-500' },
    strong: { label: 'Strong', color: 'text-green-500', bar: 'bg-green-500' },
  };

  return {
    results,
    score,
    isStrong,
    level,
    levelLabel: levelMap[level].label,
    levelColor: levelMap[level].color,
    barColor: levelMap[level].bar,
  };
}
