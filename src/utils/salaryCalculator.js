export class SalaryCalculator {
  constructor() {
    this.taxRates = {
      federal: [
        { limit: 57375, rate: 0.15 },
        { limit: 114750, rate: 0.205 },
        { limit: 177882, rate: 0.26 },
        { limit: 253414, rate: 0.29 },
        { limit: Infinity, rate: 0.33 }
      ],
      provincial: {
        QC: [
          { limit: 53255, rate: 0.14 },
          { limit: 106495, rate: 0.19 },
          { limit: 129590, rate: 0.24 },
          { limit: Infinity, rate: 0.2575 }
        ],
        ON: [
          { limit: 54183, rate: 0.0505 },
          { limit: 108367, rate: 0.0915 },
          { limit: 150000, rate: 0.1116 },
          { limit: 220000, rate: 0.1216 },
          { limit: Infinity, rate: 0.1316 }
        ]
      }
    };
  }

  calculateTax(income, brackets) {
    let tax = 0;
    let prev = 0;
    
    for (const bracket of brackets) {
      const taxable = Math.min(income, bracket.limit) - prev;
      if (taxable > 0) {
        tax += taxable * bracket.rate;
        prev = bracket.limit;
      } else {
        break;
      }
    }
    
    return tax;
  }

  calculateBasicSalary(grossSalary, province, status) {
    const isFreelance = status === 'freelance';
    
    // Federal tax
    const federalTax = this.calculateTax(grossSalary, this.taxRates.federal);
    
    // Provincial tax
    const provincialTax = this.calculateTax(grossSalary, this.taxRates.provincial[province]);
    
    // RRQ
    const rrqRate = isFreelance ? 0.128 : 0.064;
    const rrq = Math.min(Math.max(0, grossSalary - 3500), 71200 - 3500) * rrqRate;
    
    // RQAP & AE
    const rqap = Math.min(grossSalary, 98000) * (isFreelance ? 0.00878 : 0.00494);
    const ae = isFreelance ? 0 : Math.min(grossSalary, 65700) * 0.0131;
    
    const totalBasicDeductions = federalTax + provincialTax + rrq + rqap + ae;
    const basicNet = grossSalary - totalBasicDeductions;
    
    return {
      gross: grossSalary,
      basicNet: basicNet,
      federal: federalTax,
      provincial: provincialTax,
      rrq: rrq,
      rqap: rqap,
      ae: ae,
      totalBasicDeductions: totalBasicDeductions,
      effectiveRate: (totalBasicDeductions / grossSalary) * 100
    };
  }

  calculateAdvancedSalary(basicResult, advancedDeductions) {
    let totalAdvancedDeductions = 0;
    const advancedDetails = {};
    
    for (const [key, value] of Object.entries(advancedDeductions)) {
      if (value > 0) {
        const annualAmount = value * 12; // Convert monthly to annual
        totalAdvancedDeductions += annualAmount;
        advancedDetails[key] = annualAmount;
      }
    }
    
    const finalNet = basicResult.basicNet - totalAdvancedDeductions;
    
    return {
      ...basicResult,
      finalNet: finalNet,
      advancedDeductions: advancedDetails,
      totalAdvancedDeductions: totalAdvancedDeductions,
      totalAllDeductions: basicResult.totalBasicDeductions + totalAdvancedDeductions,
      finalEffectiveRate: ((basicResult.totalBasicDeductions + totalAdvancedDeductions) / basicResult.gross) * 100
    };
  }

  getTimeBreakdown(annualNet, hoursPerWeek = 35) {
    const weeksPerYear = 52;
    const workingDaysPerYear = 260; // 5 days/week * 52 weeks
    const totalHoursPerYear = hoursPerWeek * weeksPerYear;
    
    return {
      annual: annualNet,
      monthly: annualNet / 12,
      biMonthly: annualNet / 24,
      biWeekly: annualNet / 26,
      weekly: annualNet / weeksPerYear,
      daily: annualNet / workingDaysPerYear,
      hourly: annualNet / totalHoursPerYear
    };
  }
}