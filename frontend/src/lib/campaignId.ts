export function encodeCampaignId(id: number): string {
  if (!id || isNaN(id)) return '';
  const val = id * 1395817 + 294719283;
  return `cmp_${val.toString(36)}`;
}

export function decodeCampaignId(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  
  const strVal = String(val).trim();
  if (!strVal) return 0;
  
  // Check if it's already a numeric string (backward compatibility)
  if (/^\d+$/.test(strVal)) {
    return parseInt(strVal, 10);
  }
  
  const cleanStr = strVal.startsWith('cmp_') ? strVal.substring(4) : strVal;
  const numVal = parseInt(cleanStr, 36);
  if (isNaN(numVal)) {
    // Fallback: check if the original strVal is just a number disguised
    const parsed = parseInt(strVal, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  const diff = numVal - 294719283;
  if (diff < 0 || diff % 1395817 !== 0) {
    // Fallback: check if the original strVal is just a number disguised
    const parsed = parseInt(strVal, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return diff / 1395817;
}
