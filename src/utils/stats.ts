// ============================================
// Effect Size Calculation (Cohen's d)
// Used for comparing evaluation scores across conditions
// ============================================

export function calculateEffectSize(
  group1: number[],
  group2: number[]
): { cohensD: number; interpretation: 'negligible' | 'small' | 'medium' | 'large' } {
  if (group1.length === 0 || group2.length === 0) {
    return { cohensD: 0, interpretation: 'negligible' };
  }

  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
  
  // Calculate variance for each group
  const var1 = group1.length > 1 
    ? group1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) / (group1.length - 1)
    : 0;
  const var2 = group2.length > 1
    ? group2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (group2.length - 1)
    : 0;
  
  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((group1.length - 1) * var1 + (group2.length - 1) * var2) / 
    (group1.length + group2.length - 2)
  );
  
  // Cohen's d
  const cohensD = pooledStd > 0 ? (mean1 - mean2) / pooledStd : 0;
  
  // Interpretation thresholds (Cohen, 1988)
  const absD = Math.abs(cohensD);
  let interpretation: 'negligible' | 'small' | 'medium' | 'large';
  if (absD < 0.2) interpretation = 'negligible';
  else if (absD < 0.5) interpretation = 'small';
  else if (absD < 0.8) interpretation = 'medium';
  else interpretation = 'large';
  
  return { cohensD: Math.round(cohensD * 100) / 100, interpretation };
}

// Calculate mean of an array
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculate standard deviation
export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}


