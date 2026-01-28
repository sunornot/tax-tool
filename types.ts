
export interface EmployeeData {
  monthlySalary: number; // 月薪
  annualBonus: number; // 年终奖总额
  socialInsurance: number; // 每月社保公积金扣除
  additionalDeductions: number; // 每月专项附加扣除 (子女教育、赡养老人等)
  otherDeductions: number; // 其他扣除
}

export interface TaxBracket {
  limit: number;
  rate: number;
  quickDeduction: number;
}

export interface CalculationResult {
  strategyName: string;
  bonusAsTaxable: number;
  salaryAsTaxable: number;
  totalTax: number;
  netIncome: number;
  bonusTax: number;
  salaryTax: number;
}

export interface OptimizationSummary {
  bestStrategy: CalculationResult;
  allBonusStrategy: CalculationResult;
  allSalaryStrategy: CalculationResult;
  savings: number;
}
