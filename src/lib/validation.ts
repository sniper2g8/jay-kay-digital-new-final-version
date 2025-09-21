export const MAX_VARCHAR_LENGTH = 20;

export function truncateToVarcharLimit(value: string | null | undefined, maxLength = MAX_VARCHAR_LENGTH): string | null {
  if (!value) return null;
  return value.substring(0, maxLength);
}

export function getRemainingCharacters(value: string | null | undefined, maxLength = MAX_VARCHAR_LENGTH): number {
  if (!value) return maxLength;
  return Math.max(0, maxLength - value.length);
}