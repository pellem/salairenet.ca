// Calculateur amélioré avec animations et contenu dynamique

class EnhancedSalaryCalculator {
  constructor() {
    this.currentProvince = 'QC';
    this.currentStatus = 'salarie';
    this.currentSalary = 0;
    this.initEventListeners();
    this.updateProvinceLabels();
  }

  initEventListeners() {
    // Province toggles
    document.getElementById('toggle-qc').addEventListener('click', () => this.switchProvince('QC'));
    document.getElementById('toggle-on').addEventListener('click', () => this.switchProvince('ON'));

    // Status toggles
    document.getElementById('status-employee').addEventListener('click', () => this.switchStatus('salarie'));
    document.getElementById('status-freelance').addEventListener('click', () => this.switchStatus('freelance'));

    // Salary input & slider synchronization
    const salaryInput = document.getElementById('salary-input');
    const salarySlider = document.getElementById('salary-slider');

    salaryInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      salarySlider.value = Math.min(value, 150000);
      this.calculateSalary(value);
    });

    salarySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      salaryInput.value = value;
      this.calculateSalary(value);
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const salary = parseInt(btn.dataset.salary);
        const type = btn.dataset.type;
        
        salaryInput.value = salary;
        salarySlider.value = salary;
        this.switchStatus(type);
        this.calculateSalary(salary);
        
        // Visual feedback
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = '', 150);
      });
    });

    // Default calculation
    setTimeout(() => {
      salaryInput.value = 65000;
      salarySlider.value = 65000;
      this.calculateSalary(65000);
    }, 100);
  }

  switchProvince(province) {
    this.currentProvince = province;
    
    // Update toggle states
    document.querySelectorAll('.province-toggle').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`toggle-${province.toLowerCase()}`).classList.add('active');
    
    this.updateProvinceLabels();
    this.calculateSalary(this.currentSalary);
    
    // Show/hide comparison
    const comparison = document.getElementById('province-comparison');
    if (province === 'ON') {
      comparison.classList.remove('hidden');
      this.renderProvinceComparison();
    } else {
      comparison.classList.add('hidden');
    }
  }

  switchStatus(status) {
    this.currentStatus = status;
    
    // Update toggle states
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`status-${status === 'salarie' ? 'employee' : 'freelance'}`).classList.add('active');
    
    this.calculateSalary(this.currentSalary);
  }

  updateProvinceLabels() {
    const labels = {
      QC: { title: 'Québec 2025', provincial: '🍁 Impôt Québec' },
      ON: { title: 'Ontario 2025', provincial: '🏢 Impôt Ontario' }
    };
    
    document.getElementById('province-title').textContent = labels[this.currentProvince].title;
    document.getElementById('provincial-label').textContent = labels[this.currentProvince].provincial;
  }

  calculateSalary(grossSalary) {
    if (!grossSalary || grossSalary <= 0) {
      document.getElementById('results-container').classList.add('hidden');
      return;
    }

    this.currentSalary = grossSalary;
    
    // Calculate deductions
    const result = this.computeDeductions(grossSalary, this.currentProvince, this.currentStatus);
    
    // Show results with animation
    const container = document.getElementById('results-container');
    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      container.classList.add('animate-slide-in');
    }

    this.updateResults(result);
    this.updateDynamicContent(result);
    this.updateVisualBreakdown(result);
  }

  computeDeductions(grossSalary, province, status) {
    const isFreelance = status === 'freelance';
    
    // Federal tax brackets
    const federalTax = this.calculateTax(grossSalary, [
      { limit: 57375, rate: 0.15 },
      { limit: 114750, rate: 0.205 },
      { limit: 177882, rate: 0.26 },
      { limit: 253414, rate: 0.29 },
      { limit: Infinity, rate: 0.33 }
    ]);

    // Provincial tax brackets
    const provincialRates = {
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
    };
    
    const provincialTax = this.calculateTax(grossSalary, provincialRates[province]);

    // RRQ
    const rrqRate = isFreelance ? 0.128 : 0.064;
    const rrq = Math.min(Math.max(0, grossSalary - 3500), 71200 - 3500) * rrqRate;

    // RQAP & AE
    const rqap = Math.min(grossSalary, 98000) * (isFreelance ? 0.00878 : 0.00494);
    const ae = isFreelance ? 0 : Math.min(grossSalary, 65700) * 0.0131;

    const totalDeductions = federalTax + provincialTax + rrq + rqap + ae;
    const netSalary = grossSalary - totalDeductions;

    return {
      gross: grossSalary,
      net: netSalary,
      federal: federalTax,
      provincial: provincialTax,
      rrq: rrq,
      rqap: rqap,
      ae: ae,
      other: rqap + ae,
      totalDeductions: totalDeductions,
      effectiveRate: (totalDeductions / grossSalary) * 100
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

  updateResults(result) {
    const formatCurrency = (amount) => 
      new Intl.NumberFormat('fr-CA', { 
        style: 'currency', 
        currency: 'CAD',
        maximumFractionDigits: 0 
      }).format(amount);

    // Main results
    document.getElementById('net-annual').textContent = formatCurrency(result.net);
    document.getElementById('net-monthly').textContent = formatCurrency(result.net / 12);

    // Breakdown amounts
    document.getElementById('amount-federal').textContent = `-${formatCurrency(result.federal)}`;
    document.getElementById('amount-provincial').textContent = `-${formatCurrency(result.provincial)}`;
    document.getElementById('amount-rrq').textContent = `-${formatCurrency(result.rrq)}`;
    document.getElementById('amount-other').textContent = `-${formatCurrency(result.other)}`;
  }

  updateVisualBreakdown(result) {
    const total = result.gross;
    const netPercent = (result.net / total) * 100;
    const federalPercent = (result.federal / total) * 100;
    const provincialPercent = (result.provincial / total) * 100;
    const rrqPercent = (result.rrq / total) * 100;
    const otherPercent = (result.other / total) * 100;

    // Update visual bar
    document.getElementById('bar-net').style.width = `${netPercent}%`;
    document.getElementById('bar-federal').style.width = `${federalPercent}%`;
    document.getElementById('bar-provincial').style.width = `${provincialPercent}%`;
    document.getElementById('bar-rrq').style.width = `${rrqPercent}%`;
    document.getElementById('bar-other').style.width = `${otherPercent}%`;
  }

  updateDynamicContent(result) {
    const formatCurrency = (amount) => 
      new Intl.NumberFormat('fr-CA', { 
        style: 'currency', 
        currency: 'CAD',
        maximumFractionDigits: 0 
      }).format(amount);

    // Dynamic context
    const avgSalary = this.currentProvince === 'QC' ? 56000 : 62000;
    const comparison = result.gross > avgSalary ? 'au-dessus' : 'en dessous';
    const difference = Math.abs(result.gross - avgSalary);
    
    const contextHTML = `
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <span class="text-2xl">${this.currentStatus === 'freelance' ? '🚀' : '💼'}</span>
          <span class="font-medium">${this.currentStatus === 'freelance' ? 'Travailleur autonome' : 'Salarié'}</span>
        </div>
        <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p class="text-emerald-800 font-medium">Taux effectif d'imposition</p>
          <p class="text-2xl font-bold text-emerald-600">${result.effectiveRate.toFixed(1)}%</p>
        </div>
        <div class="text-sm text-gray-600">
          <p>Votre salaire est <span class="font-semibold text-${comparison === 'au-dessus' ? 'green' : 'orange'}-600">${formatCurrency(difference)} ${comparison}</span> de la moyenne ${this.currentProvince === 'QC' ? 'québécoise' : 'ontarienne'}</p>
        </div>
      </div>
    `;
    
    document.getElementById('dynamic-context').innerHTML = contextHTML;

    // Comparison content
    const comparisonHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span class="text-gray-600">Salaire moyen ${this.currentProvince}</span>
          <span class="font-semibold">${formatCurrency(avgSalary)}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
          <span class="text-emerald-700">Votre position</span>
          <span class="font-bold text-emerald-600">${comparison === 'au-dessus' ? '+' : ''}${formatCurrency(result.gross - avgSalary)}</span>
        </div>
      </div>
    `;
    
    document.getElementById('comparison-content').innerHTML = comparisonHTML;

    // Personalized tips
    this.updatePersonalizedTips(result);
  }

  updatePersonalizedTips(result) {
    const monthlyNet = result.net / 12;
    const tips = [];

    if (monthlyNet > 4000) {
      tips.push(`💰 Avec ${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(monthlyNet)}/mois, pensez au REER pour optimiser vos impôts`);
    }

    if (this.currentStatus === 'freelance') {
      tips.push(`🚀 En freelance, pensez à déduire vos frais professionnels (bureau, équipement, formations)`);
    }

    const housingBudget = monthlyNet * 0.3;
    tips.push(`🏠 Budget logement recommandé : max ${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(housingBudget)}/mois`);

    const emergencyFund = monthlyNet * 6;
    tips.push(`🛡️ Fonds d'urgence recommandé : ${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(emergencyFund)}`);

    const tipsHTML = tips.map(tip => `
      <div class="flex items-start space-x-2">
        <span class="text-amber-600 mt-0.5">•</span>
        <span class="text-amber-800">${tip}</span>
      </div>
    `).join('');

    document.getElementById('tips-content').innerHTML = tipsHTML;
  }

  renderProvinceComparison() {
    if (this.currentSalary <= 0) return;
const onResult = this.computeDeductions(this.currentSalary, 'ON', this.currentStatus);
   
   const formatCurrency = (amount) => 
     new Intl.NumberFormat('fr-CA', { 
       style: 'currency', 
       currency: 'CAD',
       maximumFractionDigits: 0 
     }).format(amount);

   const difference = onResult.net - qcResult.net;
   const betterProvince = difference > 0 ? 'Ontario' : 'Québec';
   const savingsText = difference > 0 
     ? `+${formatCurrency(difference)} en Ontario` 
     : `+${formatCurrency(Math.abs(difference))} au Québec`;

   const comparisonHTML = `
     <div class="bg-blue-50 rounded-xl p-6 border border-blue-200">
       <div class="flex items-center justify-between mb-4">
         <h4 class="font-bold text-blue-800">🍁 Québec</h4>
         <div class="text-right">
           <div class="text-2xl font-bold text-blue-600">${formatCurrency(qcResult.net)}</div>
           <div class="text-sm text-blue-600">net/année</div>
         </div>
       </div>
       <div class="space-y-2 text-sm">
         <div class="flex justify-between">
           <span>Impôt provincial</span>
           <span class="font-medium text-red-600">-${formatCurrency(qcResult.provincial)}</span>
         </div>
         <div class="flex justify-between">
           <span>Services publics</span>
           <span class="text-green-600">++</span>
         </div>
         <div class="flex justify-between">
           <span>Garderies subventionnées</span>
           <span class="text-green-600">✓</span>
         </div>
       </div>
     </div>

     <div class="bg-orange-50 rounded-xl p-6 border border-orange-200">
       <div class="flex items-center justify-between mb-4">
         <h4 class="font-bold text-orange-800">🏢 Ontario</h4>
         <div class="text-right">
           <div class="text-2xl font-bold text-orange-600">${formatCurrency(onResult.net)}</div>
           <div class="text-sm text-orange-600">net/année</div>
         </div>
       </div>
       <div class="space-y-2 text-sm">
         <div class="flex justify-between">
           <span>Impôt provincial</span>
           <span class="font-medium text-red-600">-${formatCurrency(onResult.provincial)}</span>
         </div>
         <div class="flex justify-between">
           <span>Coût de la vie</span>
           <span class="text-red-600">++</span>
         </div>
         <div class="flex justify-between">
           <span>Opportunités emploi</span>
           <span class="text-green-600">++</span>
         </div>
       </div>
     </div>

     <div class="md:col-span-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200 text-center">
       <div class="mb-2">
         <span class="text-2xl">${difference > 0 ? '🏢' : '🍁'}</span>
       </div>
       <div class="text-lg font-bold text-gray-800 mb-1">
         ${betterProvince} gagnant !
       </div>
       <div class="text-emerald-600 font-semibold">${savingsText}</div>
       <div class="text-sm text-gray-600 mt-2">
         ${difference > 0 
           ? 'Mais attention au coût de la vie plus élevé en Ontario' 
           : 'Le Québec offre plus de services publics pour moins cher'}
       </div>
     </div>
   `;

   document.getElementById('comparison-grid').innerHTML = comparisonHTML;
 }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
 new EnhancedSalaryCalculator();
});

// Export for potential external use
window.SalaryCalculator = EnhancedSalaryCalculator;
