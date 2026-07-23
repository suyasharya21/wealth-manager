// Streamlined AI Engine for Real-Time Financial Mathematics & Wealth Metrics
export function computeAIMetrics(state) {
  // 1. Risk Score Calculation
  let riskScore = 50;
  const q = state.riskAnswers || {};
  if (q.q1Horizon === '10+ years') riskScore += 20;
  else if (q.q1Horizon === '5-10 years') riskScore += 15;
  else if (q.q1Horizon === '3-5 years') riskScore += 5;
  else riskScore -= 15;

  if (q.q2Reaction === 'Buy More') riskScore += 15;
  else if (q.q2Reaction === 'Panic Sell') riskScore -= 20;

  if (q.q3Objective === 'Aggressive Expansion') riskScore += 15;
  else if (q.q3Objective === 'Capital Preservation') riskScore -= 15;

  riskScore = Math.max(10, Math.min(99, riskScore));

  let riskCategory = 'Balanced';
  if (riskScore < 30) riskCategory = 'Very Conservative';
  else if (riskScore < 50) riskCategory = 'Conservative';
  else if (riskScore < 70) riskCategory = 'Balanced';
  else if (riskScore < 85) riskCategory = 'Growth';
  else riskCategory = 'Aggressive';

  // 2. Financial Health Score
  let healthScore = 65;
  if (state.netWorth && state.netWorth !== 'Below 1Cr') healthScore += 15;
  if (state.liquidAssets && parseFloat(state.liquidAssets) > 5000000) healthScore += 10;
  healthScore = Math.max(20, Math.min(98, healthScore));

  // 3. Estimate Annual Income Value
  let annualIncNum = 5000000;
  if (state.annualIncome === '1-5Cr') annualIncNum = 25000000;
  else if (state.annualIncome === '5-10Cr') annualIncNum = 75000000;
  else if (state.annualIncome === '10-25Cr') annualIncNum = 175000000;
  else if (state.annualIncome === '25Cr+') annualIncNum = 300000000;
  else if (state.incomeCustom) annualIncNum = parseFloat(state.incomeCustom);

  // 4. Emergency Fund Score
  const monthlyEst = annualIncNum / 12;
  const liquid = parseFloat(state.liquidAssets) || 2000000;
  const monthsCovered = liquid / (monthlyEst * 0.5 || 1);
  const emergencyScore = Math.min(100, Math.round((monthsCovered / 12) * 100));

  // 5. Tax Reserve Calculation
  const estTaxRate = state.taxRegime === 'New' ? 0.30 : 0.33;
  const taxReserve = Math.round(annualIncNum * estTaxRate);

  // 6. Goal SIP & Lumpsum Math
  const calculatedGoals = (state.goals || []).map(goal => {
    const bifurcations = goal.bifurcations || [];
    let totalAlloc = bifurcations.reduce((acc, curr) => acc + parseFloat(curr.allocation || 0), 0);
    if (totalAlloc === 0) totalAlloc = parseFloat(goal.targetAmount) || 0;

    let weightedYieldSum = bifurcations.reduce((acc, curr) => acc + (parseFloat(curr.allocation || 0) * parseFloat(curr.yield || 0)), 0);
    let blendedYield = totalAlloc > 0 ? (weightedYieldSum / totalAlloc) : 0;

    const years = Math.max(1, parseInt(goal.targetYears) || 10);
    const inflation = 0.07; // standard 7%
    
    // Future value logic based on goal category
    let fv = 0;
    let drawdownRows = [];
    let growthRows = [];
    
    const rBlended = blendedYield / 100;
    
    if (goal.type === 'Health Emergency Reserve' || goal.type === 'Lifestyle Maintenance Fund') {
      // Drawdown strategy: Bucket Year-wise Drawdown Illustration
      let balance = totalAlloc;
      const annualWithdrawal = totalAlloc / years;
      
      for (let yr = 1; yr <= years; yr++) {
        const opening = balance;
        const withdrawal = Math.min(opening, annualWithdrawal);
        const interest = Math.max(0, (opening - withdrawal) * rBlended);
        const closing = Math.max(0, opening - withdrawal + interest);
        
        drawdownRows.push({
          year: yr,
          opening: Math.round(opening),
          withdrawal: Math.round(withdrawal),
          interest: Math.round(interest),
          closing: Math.round(closing)
        });
        balance = closing;
      }
      fv = Math.round(totalAlloc); // Reserve size
    } else {
      // Accumulation strategy: Growth year-by-year
      let balance = totalAlloc;
      for (let yr = 1; yr <= years; yr++) {
        const opening = balance;
        const growth = opening * rBlended;
        const closing = opening + growth;
        
        growthRows.push({
          year: yr,
          opening: Math.round(opening),
          growth: Math.round(growth),
          closing: Math.round(closing)
        });
        balance = closing;
      }
      fv = Math.round(balance);
    }

    const rMonthly = rBlended / 12;
    const months = years * 12;
    const sip = rMonthly > 0 ? Math.round((fv * rMonthly) / (Math.pow(1 + rMonthly, months) - 1)) : 0;
    const lumpsum = Math.round(fv / Math.pow(1 + rBlended, years));
    const prob = Math.min(98, Math.max(65, 80 + (riskCategory === 'Growth' ? 8 : 4) - (years < 3 ? 10 : 0)));

    return {
      ...goal,
      totalAlloc,
      blendedYield,
      futureValue: fv,
      calculatedSIP: sip,
      calculatedLumpsum: lumpsum,
      probability: prob,
      drawdownRows,
      growthRows
    };
  });

  // 7. Family Protection Score
  let familyProtectionScore = 40;
  if (state.hasLifeInsurance === 'Yes') familyProtectionScore += 30;
  if (state.hasHealthInsurance === 'Yes') familyProtectionScore += 30;

  // 8. Portfolio Allocation
  let allocation = { stocks: 40, mutualFunds: 25, alts: 20, cash: 15 };
  if (riskCategory === 'Aggressive') {
    allocation = { stocks: 55, mutualFunds: 25, alts: 15, cash: 5 };
  } else if (riskCategory === 'Conservative') {
    allocation = { stocks: 20, mutualFunds: 30, alts: 20, cash: 30 };
  }

  // 9. Overall AI Wealth Score
  const aiWealthScore = Math.round((healthScore * 0.35) + (riskScore * 0.25) + (emergencyScore * 0.2) + (familyProtectionScore * 0.2));

  // Dynamic Suggestion
  let suggestion = `Based on your profile as a ${state.occupation || 'HNI Client'} in ${state.city || 'India'}, we recommend structuring an AIF/PMS allocation of ${allocation.alts}% with an estimated tax reserve of ₹${(taxReserve/100000).toFixed(1)} Lakhs.`;

  return {
    riskScore,
    riskCategory,
    healthScore,
    emergencyScore,
    taxReserve,
    calculatedGoals,
    familyProtectionScore,
    allocation,
    aiWealthScore,
    suggestion
  };
}
