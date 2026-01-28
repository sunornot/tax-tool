
import { EmployeeData, CalculationResult, OptimizationSummary, SearchPoint } from '../types';
import { ANNUAL_TAX_BRACKETS, BONUS_TAX_BRACKETS, STANDARD_DEDUCTION } from '../constants';

/**
 * 计算综合所得税
 */
export const calculateComprehensiveTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  for (const bracket of ANNUAL_TAX_BRACKETS) {
    if (taxableIncome <= bracket.limit) {
      return taxableIncome * bracket.rate - bracket.quickDeduction;
    }
  }
  const topBracket = ANNUAL_TAX_BRACKETS[ANNUAL_TAX_BRACKETS.length - 1];
  return taxableIncome * topBracket.rate - topBracket.quickDeduction;
};

/**
 * 计算全年一次性奖金税
 */
export const calculateBonusTax = (bonus: number): number => {
  if (bonus <= 0) return 0;
  const monthlyAverage = bonus / 12;
  for (const bracket of BONUS_TAX_BRACKETS) {
    if (monthlyAverage <= bracket.limit) {
      return bonus * bracket.rate - bracket.quickDeduction;
    }
  }
  const topBracket = BONUS_TAX_BRACKETS[BONUS_TAX_BRACKETS.length - 1];
  return bonus * topBracket.rate - topBracket.quickDeduction;
};

/**
 * 执行优化计算
 */
export const optimizeBonus = (data: EmployeeData): OptimizationSummary => {
  const { monthlySalary, annualBonus, socialInsurance, additionalDeductions, otherDeductions } = data;
  
  const annualBaseTaxable = Math.max(0, (monthlySalary * 12) - STANDARD_DEDUCTION - (socialInsurance * 12) - (additionalDeductions * 12) - (otherDeductions * 12));
  
  const calculateTotal = (bonusPart: number, salaryPart: number, name: string): CalculationResult => {
    const sTax = calculateComprehensiveTax(annualBaseTaxable + salaryPart);
    const bTax = calculateBonusTax(bonusPart);
    const totalTax = sTax + bTax;
    const grossTotal = (monthlySalary * 12) + annualBonus;
    const netIncome = grossTotal - (socialInsurance * 12) - totalTax;
    
    return {
      strategyName: name,
      bonusAsTaxable: bonusPart,
      salaryAsTaxable: salaryPart,
      totalTax,
      netIncome,
      salaryTax: sTax,
      bonusTax: bTax
    };
  };

  const allBonus = calculateTotal(annualBonus, 0, "方案A：全部年终奖计税");
  const allSalary = calculateTotal(0, annualBonus, "方案B：全部并入工资薪金");

  let bestStrategy = allBonus;
  const searchPath: SearchPoint[] = [];
  
  // 更加精细的搜索：至少20个采样点，或者每1000元一个点
  const step = Math.max(100, Math.floor(annualBonus / 50));
  
  for (let bonusPart = 0; bonusPart <= annualBonus; bonusPart += step) {
    const salaryPart = annualBonus - bonusPart;
    const current = calculateTotal(bonusPart, salaryPart, "方案C：最优拆分组合");
    
    searchPath.push({
      bonusPart,
      totalTax: current.totalTax
    });

    if (current.totalTax < bestStrategy.totalTax) {
      bestStrategy = { ...current, strategyName: "方案C：最优拆分组合" };
    }
  }
  
  // 确保最后一个点（全部年终奖）也被加入路径
  if (searchPath[searchPath.length - 1].bonusPart !== annualBonus) {
    searchPath.push({ bonusPart: annualBonus, totalTax: allBonus.totalTax });
  }

  return {
    bestStrategy,
    allBonusStrategy: allBonus,
    allSalaryStrategy: allSalary,
    savings: Math.max(allBonus.totalTax, allSalary.totalTax) - bestStrategy.totalTax,
    searchPath
  };
};
