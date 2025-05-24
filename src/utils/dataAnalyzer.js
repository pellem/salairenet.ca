import salaryData from '../data/salaryData.json';
import financialTips from '../data/financialTips.json';

export class DataAnalyzer {
  static findJobComparison(salary) {
    const { jobComparisons } = salaryData;
    
    // Find closest job by salary
    const closest = jobComparisons.reduce((prev, current) => {
      return Math.abs(current.salary - salary) < Math.abs(prev.salary - salary) 
        ? current 
        : prev;
    });
    
    return closest;
  }

  static getPercentileRank(salary) {
    const { percentileRanges } = salaryData;
    
    for (const range of percentileRanges) {
      if (salary >= range.minSalary && salary <= range.maxSalary) {
        return range;
      }
    }
    
    return percentileRanges[percentileRanges.length - 1]; // Fallback to highest
  }

  static getSavingsRecommendations(salary) {
    const { savingsRecommendations } = financialTips;
    
    for (const recommendation of savingsRecommendations) {
      if (salary >= recommendation.minSalary && salary <= recommendation.maxSalary) {
        return recommendation;
      }
    }
    
    return savingsRecommendations[savingsRecommendations.length - 1]; // Fallback
  }

  static getHousingRecommendations(netMonthly, province) {
    const maxHousing = netMonthly * (financialTips.budgetRules.housing.percentage / 100);
    const { housingCosts } = salaryData;
    
    const cities = province === 'QC' 
      ? { montreal: housingCosts.montreal, quebec: housingCosts.quebec }
      : { toronto: housingCosts.toronto, ottawa: housingCosts.ottawa };
    
    const recommendations = {};
    
    for (const [city, costs] of Object.entries(cities)) {
      recommendations[city] = {
        affordable: Object.entries(costs)
          .filter(([type, cost]) => cost <= maxHousing)
          .map(([type, cost]) => ({ type, cost })),
        maxBudget: maxHousing
      };
    }
    
    return recommendations;
  }

  static generateDynamicFAQ(salaryResult, province, status) {
    const monthlyNet = salaryResult.finalNet / 12;
    const jobComparison = this.findJobComparison(salaryResult.gross);
    const percentile = this.getPercentileRank(salaryResult.gross);
    const savings = this.getSavingsRecommendations(salaryResult.gross);
    
    const formatCurrency = (amount) => 
      new Intl.NumberFormat('fr-CA', { 
        style: 'currency', 
        currency: 'CAD',
        maximumFractionDigits: 0 
      }).format(amount);

    return [
      {
        question: `Pourquoi je paie ${formatCurrency(salaryResult.totalAllDeductions)} en déductions ?`,
        answer: `Avec votre salaire de <strong class="text-emerald-600">${formatCurrency(salaryResult.gross)}</strong>, vous payez ${salaryResult.finalEffectiveRate.toFixed(1)}% en impôts et cotisations. C'est normal au ${province === 'QC' ? 'Québec' : 'Canada'} pour financer les services publics (santé gratuite, éducation, infrastructures).`
      },
      {
        question: `Comment optimiser mes ${formatCurrency(monthlyNet)} nets mensuels ?`,
        answer: `Avec vos revenus, nous recommandons : <strong class="text-emerald-600">${formatCurrency(savings.rrsp)}/mois en REER</strong> (économise ~${formatCurrency(savings.rrsp * 0.32)} d'impôts), <strong class="text-emerald-600">${formatCurrency(savings.celiapp)}/mois en CELIAPP</strong>, et <strong class="text-emerald-600">${formatCurrency(savings.tfsa)}/mois en CELI</strong>.`
      },
      {
        question: `Est-ce que ${formatCurrency(salaryResult.gross)} est un bon salaire ?`,
        answer: `Oui ! Vous gagnez comme <strong class="text-emerald-600">${jobComparison.emoji} ${jobComparison.title}</strong> et vous êtes dans le <strong class="text-emerald-600">top ${percentile.percentile}</strong> des revenus québécois. C'est ${percentile.description}.`
      },
      {
        question: `Combien budgéter pour le logement avec ${formatCurrency(monthlyNet)}/mois ?`,
        answer: `Maximum recommandé : <strong class="text-emerald-600">${formatCurrency(monthlyNet * 0.3)}/mois</strong> (30% de vos revenus nets). ${province === 'QC' ? 'À Montréal, vous pouvez avoir un beau 3½ pour ce budget.' : 'À Toronto, ce sera plus serré pour un 2 chambres.'}`
      },
      {
        question: `Que faire si j'obtiens une augmentation de 10 000$ ?`,
        answer: `Avec 10k$ de plus, vous toucheriez environ <strong class="text-emerald-600">${formatCurrency((salaryResult.gross + 10000) * (1 - salaryResult.finalEffectiveRate / 100) / 12)}/mois</strong> nets supplémentaires. Parfait pour augmenter votre épargne REER !`
      }
    ];
  }
}