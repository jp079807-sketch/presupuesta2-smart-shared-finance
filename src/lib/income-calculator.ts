// Colombian income tax calculator
// Types of income: labor_contract, service_contract, exempt

export type IncomeType = 'labor_contract' | 'service_contract' | 'exempt';

export const INCOME_TYPES: { value: IncomeType; label: string; description: string }[] = [
  { 
    value: 'labor_contract', 
    label: 'Contrato laboral', 
    description: 'Empleado con contrato de trabajo (salud 4% + pensión 4%)' 
  },
  { 
    value: 'service_contract', 
    label: 'Prestación de servicios', 
    description: 'Independiente o contratista (salud 4% + pensión 4% sobre 40% del ingreso)' 
  },
  { 
    value: 'exempt', 
    label: 'Exento', 
    description: 'Sin deducciones (ej: dividendos, arriendos)' 
  },
];

export function getIncomeTypeInfo(type: IncomeType) {
  return INCOME_TYPES.find(t => t.value === type) || INCOME_TYPES[0];
}

/**
 * Calculate net income based on Colombian deduction rules
 * 
 * Labor Contract (Contrato Laboral):
 * - Health: 4% of gross
 * - Pension: 4% of gross
 * - Total deduction: 8%
 * 
 * Service Contract (Prestación de Servicios):
 * - Base for social security: 40% of gross
 * - Health: 12.5% of base (employee pays all)
 * - Pension: 16% of base (employee pays all)
 * - Simplified: approximately 11.4% of gross
 * 
 * Exempt: No deductions
 */
export function calculateNetIncome(grossAmount: number, incomeType: IncomeType): number {
  switch (incomeType) {
    case 'labor_contract':
      // Employee deductions: 4% health + 4% pension = 8%
      const laborDeduction = grossAmount * 0.08;
      return grossAmount - laborDeduction;
    
    case 'service_contract':
      // Independent contractor: pays social security on 40% of income
      // Health: 12.5% of 40% = 5% of gross
      // Pension: 16% of 40% = 6.4% of gross
      // Simplified to approximately 4% + 4% = 8% on 40% base
      const base = grossAmount * 0.40;
      const healthDeduction = base * 0.125; // 12.5%
      const pensionDeduction = base * 0.16; // 16%
      return grossAmount - healthDeduction - pensionDeduction;
    
    case 'exempt':
      return grossAmount;
    
    default:
      return grossAmount;
  }
}

/**
 * Get deduction breakdown for display
 */
export function getDeductionBreakdown(grossAmount: number, incomeType: IncomeType): {
  health: number;
  pension: number;
  total: number;
  netAmount: number;
} {
  switch (incomeType) {
    case 'labor_contract':
      const laborHealth = grossAmount * 0.04;
      const laborPension = grossAmount * 0.04;
      return {
        health: laborHealth,
        pension: laborPension,
        total: laborHealth + laborPension,
        netAmount: grossAmount - laborHealth - laborPension,
      };
    
    case 'service_contract':
      const base = grossAmount * 0.40;
      const serviceHealth = base * 0.125;
      const servicePension = base * 0.16;
      return {
        health: serviceHealth,
        pension: servicePension,
        total: serviceHealth + servicePension,
        netAmount: grossAmount - serviceHealth - servicePension,
      };
    
    case 'exempt':
    default:
      return {
        health: 0,
        pension: 0,
        total: 0,
        netAmount: grossAmount,
      };
  }
}
