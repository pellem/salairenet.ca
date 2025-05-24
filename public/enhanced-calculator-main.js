import { SalaryCalculator } from '/src/utils/salaryCalculator.js';
import { DataAnalyzer } from '/src/utils/dataAnalyzer.js';
import { UrlManager } from '/src/utils/urlManager.js';

class UltimateSalaryCalculator {
  constructor() {
    this.calculator = new SalaryCalculator();
    this.currentProvince = 'QC';
    this.currentStatus = 'salarie';
    this.currentSalary = 0;
    this.currentHours = 35;
    this.advancedDeductions = {};
    this.advancedPanelOpen = false;
    
    this.init();
  }

  async init() {
    await this.loadAdvancedDeductions();
    this.initEventListeners();
    this.loadFromUrl();
    this.updateProvinceLabels();
  }

  async loadAdvancedDeductions() {
    try {
      const response = await fetch('/src/data/advancedDeductions.json');
      this.advancedDeductionsData = await response.json();
      this.renderAdvancedDeductions();
    } catch (error) {
      console.error('Failed to load advanced deductions:', error);
    }
  }

  loadFromUrl() {
    const params = UrlManager.parseUrlParams();
    if (params.salary > 0) {
      document.getElementById('salary-input').value = params.salary;
      document.getElementById('salary-slider').value = params.salary;
      this.switchStatus(params.status);
      this.switchProvince(params.province);
      document.getElementById('hours-input').value = params.hours;
      this.currentHours = params.hours;
      this.calculateSalary(params.salary);
    }
  }

  initEventListeners() {
    // Province toggles
    document.getElementById('toggle-qc').addEventListener('click', () => this.switchProvince('QC'));
    document.getElementById('toggle-on').addEventListener('click', () => this.switchProvince('ON'));

    // Status toggles
    document.getElementById('status-employee').addEventListener('click', () => this.switchStatus('salarie'));
    document.getElementById('status-freelance').addEventListener('click', () => this.switchStatus('freelance'));

    // Salary inputs
    const salaryInput = document.getElementById('salary-input');
    const salarySlider = document.getElementById('salary-slider');
    const hoursInput = document.getElementById('hours-input');

    salaryInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      salarySlider.value = Math.min(value, 200000);
      this.calculateSalary(value);
      this.updateUrl();
    });

    salarySlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      salaryInput.value = value;
      this.calculateSalary(value);
      this.updateUrl();
    });

    hoursInput.addEventListener('input', (e) => {
      this.currentHours = parseFloat(e.target.value) || 35;
      this.calculateSalary(this.currentSalary);
      this.updateUrl();
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

    // Advanced options toggle
    document.getElementById('toggle-advanced').addEventListener('click', () => {
      this.toggleAdvancedPanel();
    });

    // Share button
    document.getElementById('share-result').addEventListener('click', () => {
      this.shareResult();
    });
  }

  renderAdvancedDeductions() {
    const container = document.getElementById('advanced-deductions');
    const { commonDeductions } = this.advancedDeductionsData;

    const html = commonDeductions.map(deduction => `
      <div class="space-y-2">
        <label class="flex items-center text-sm font-medium text-amber-800">
          <span class="mr-2">${deduction.emoji}</span>
          ${deduction.name}
        </label>
        <div class="flex items-center space-x-2">
          <input 
            type="number" 
            id="advanced-${deduction.id}"
            class="flex-1 p-2 border border-amber-200 rounded-lg focus:border-amber-500 focus:ring-0 text-sm"
            placeholder="${deduction.defaultValue}"
            min="${deduction.min}"
            max="${deduction.max}"
            value="0"
          />
          <span class="text-xs text-amber-600">
            ${deduction.type === 'percentage' ? '%' : '$/mois'}
          </span>
        </div>
        <p class="text-xs text-amber-600">${deduction.description}</p>
      </div>
    `).join('');

    container.innerHTML = html;

    // Add event listeners for advanced deductions
    commonDeductions.forEach(deduction => {
      const input = document.getElementById(`advanced-${deduction.id}`);
      input.addEventListener('input', () => {
        this.updateAdvancedDeductions();
      });
    });
  }

  updateAdvancedDeductions() {
    const { commonDeductions } = this.advancedDeductionsData;
    let totalMonthly = 0;

    this.advancedDeductions = {};

    commonDeductions.forEach(deduction => {
      const input = document.getElementById(`advanced-${deduction.id}`);
      const value = parseFloat(input.value) || 0;
      
      if (value > 0) {
        if (deduction.type === 'percentage') {
          // Convert percentage to monthly amount
          const monthlyAmount = (this.currentSalary * value / 100) / 12;
          this.advancedDeductions[deduction.id] = monthlyAmount;
          totalMonthly += monthlyAmount;
        } else {
          this.advancedDeductions[deduction.id] = value;
          totalMonthly += value;
        }
      }
    });

    document.getElementById('total-advanced-monthly').textContent = this.formatCurrency(totalMonthly);
    
    // Recalculate with advanced deductions
    if (this.currentSalary > 0) {
      this.calculateAdvancedSalary();
    }
  }

  calculateAdvancedSalary() {
    const basicResult = this.calculator.calculateBasicSalary(
      this.currentSalary, 
      this.currentProvince, 
      this.currentStatus
    );

    const finalResult = this.calculator.calculateAdvancedSalary(
      basicResult, 
      this.advancedDeductions
    );

    const timeBreakdown = this.calculator.getTimeBreakdown(finalResult.finalNet, this.currentHours);

    // Update final net result
    document.getElementById('final-net-result').textContent = this.formatCurrency(finalResult.finalNet);

    // Update advanced breakdown
    this.updateAdvancedBreakdown(finalResult);
  }

  updateAdvancedBreakdown(result) {
    const advancedList = document.getElementById('advanced-deductions-list');
    const { commonDeductions } = this.advancedDeductionsData;
    
    let html = '';
    for (const [key, value] of Object.entries(result.advancedDeductions)) {
      const deduction = commonDeductions.find(d => d.id === key);
      if (deduction) {
        html += `
          <div class="flex justify-between items-center py-1">
            <span class="text-amber-600">➖ ${deduction.name} :</span>
            <span class="font-semibold text-amber-600">-${this.formatCurrency(value)}</span>
          </div>
        `;
      }
    }

    if (html) {
      advancedList.innerHTML = html;
      document.getElementById('advanced-breakdown').classList.remove('hidden');
    } else {
      document.getElementById('advanced-breakdown').classList.add('hidden');
    }
  }

  toggleAdvancedPanel() {
    const panel = document.getElementById('advanced-panel');
    const chevron = document.getElementById('advanced-chevron');
    
    this.advancedPanelOpen = !this.advancedPanelOpen;
    
    if (this.advancedPanelOpen) {
      panel.classList.remove('hidden');
      chevron.style.transform = 'rotate(180deg)';
    } else {
      panel.classList.add('hidden');
      chevron.style.transform = 'rotate(0deg)';
    }
  }

  switchProvince(province) {
    this.currentProvince = province;
    
    document.querySelectorAll('.province-toggle').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`toggle-${province.toLowerCase()}`).classList.add('active');
    
    this.updateProvinceLabels();
    this.calculateSalary(this.currentSalary);
    this.updateUrl();
    
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
    
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`status-${status === 'salarie' ? 'employee' : 'freelance'}`).classList.add('active');
    
    this.calculateSalary(this.currentSalary);
    this.updateUrl();
  }

  updateProvinceLabels() {
    const labels = {
      QC: { title: 'Québec 2025', provincial: '➖ Impôt Québec :' },
      ON: { title: 'Ontario 2025', provincial: '➖ Impôt Ontario :' }
    };
    
    document.getElementById('province-title').textContent = labels[this.currentProvince].title;
    document.getElementById('breakdown-provincial-label').textContent = labels[this.currentProvince].provincial;
  }

  calculateSalary(grossSalary) {
    if (!grossSalary || grossSalary <= 0) {
      document.getElementById('results-container').classList.add('hidden');
      document.getElementById('dynamic-faq-section').classList.add('hidden');
      return;
    }

    this.currentSalary = grossSalary;
    
    const result = this.calculator.calculateBasicSalary(grossSalary, this.currentProvince, this.currentStatus);
    const timeBreakdown = this.calculator.getTimeBreakdown(result.basicNet, this.currentHours);
    
    // Show results with animation
    const container = document.getElementById('results-container');
    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      container.classList.add('animate-slide-in');
    }

    this.updateResults(result, timeBreakdown);
    this.updateBreakdown(result);
    this.updateVisualBar(result);
    this.updateSocialComparison(result);
    this.updateFinancialRecommendations(result);
    this.updateHousingRecommendations(result);
    this.updateDynamicFAQ(result);
    
    // Update advanced calculations if panel is open
    if (this.advancedPanelOpen && Object.keys(this.advancedDeductions).length > 0) {
      this.calculateAdvancedSalary();
    }
  }

  updateResults(result, timeBreakdown) {
    document.getElementById('net-annual').textContent = this.formatCurrency(result.basicNet);
    document.getElementById('net-monthly').textContent = this.formatCurrency(timeBreakdown.monthly);
    document.getElementById('effective-rate').textContent = `${result.effectiveRate.toFixed(1)}%`;
  }

  updateBreakdown(result) {
    document.getElementById('breakdown-gross').textContent = this.formatCurrency(result.gross);
    document.getElementById('breakdown-federal').textContent = `-${this.formatCurrency(result.federal)}`;
    document.getElementById('breakdown-provincial').textContent = `-${this.formatCurrency(result.provincial)}`;
    document.getElementById('breakdown-rrq').textContent = `-${this.formatCurrency(result.rrq)}`;
    document.getElementById('breakdown-rqap').textContent = `-${this.formatCurrency(result.rqap)}`;
    document.getElementById('breakdown-ae').textContent = `-${this.formatCurrency(result.ae)}`;
    document.getElementById('breakdown-net').textContent = this.formatCurrency(result.basicNet);

    // Hide AE row for freelancers
    const aeRow = document.getElementById('breakdown-ae-row');
    if (this.currentStatus === 'freelance') {
      aeRow.classList.add('hidden');
    } else {
      aeRow.classList.remove('hidden');
    }
  }

  updateTimeBreakdown(timeBreakdown) {
    document.getElementById('time-monthly').textContent = this.formatCurrency(timeBreakdown.monthly);
    document.getElementById('time-bimonthly').textContent = this.formatCurrency(timeBreakdown.biMonthly);
    document.getElementById('time-biweekly').textContent = this.formatCurrency(timeBreakdown.biWeekly);
    document.getElementById('time-weekly').textContent = this.formatCurrency(timeBreakdown.weekly);
    document.getElementById('time-daily').textContent = this.formatCurrency(timeBreakdown.daily);
    document.getElementById('time-hourly').textContent = `${timeBreakdown.hourly.toFixed(2)} $`;
  }

updateVisualBar(result) {
    const total = result.gross;
    const netPercent = (result.basicNet / total) * 100;
    const federalPercent = (result.federal / total) * 100;
    const provincialPercent = (result.provincial / total) * 100;
    const rrqPercent = (result.rrq / total) * 100;
    const otherPercent = ((result.rqap + result.ae) / total) * 100;

    document.getElementById('bar-net').style.width = `${netPercent}%`;
    document.getElementById('bar-federal').style.width = `${federalPercent}%`;
    document.getElementById('bar-provincial').style.width = `${provincialPercent}%`;
    document.getElementById('bar-rrq').style.width = `${rrqPercent}%`;
    document.getElementById('bar-other').style.width = `${otherPercent}%`;

    // Add percentages to bars if wide enough
    if (netPercent > 10) {
      document.getElementById('bar-net').textContent = `Net ${netPercent.toFixed(0)}%`;
    }
    if (federalPercent > 8) {
      document.getElementById('bar-federal').textContent = `${federalPercent.toFixed(0)}%`;
    }
    if (provincialPercent > 8) {
      document.getElementById('bar-provincial').textContent = `${provincialPercent.toFixed(0)}%`;
    }
  }

  async updateSocialComparison(result) {
    try {
      const response = await fetch('/src/data/salaryData.json');
      const salaryData = await response.json();
      
      const comparison = DataAnalyzer.calculateSocialPosition(
        result.basicNet, 
        salaryData.percentileRanges,
        salaryData.jobComparisons
      );

      const container = document.getElementById('social-comparison');
      
      const percentileInfo = salaryData.percentileRanges.find(range => 
        result.basicNet >= range.minSalary && result.basicNet < range.maxSalary
      );

      const nearbyJobs = salaryData.jobComparisons
        .filter(job => Math.abs(job.salary - result.basicNet) < 15000)
        .slice(0, 3);

      let html = `
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <span class="text-sm font-medium text-emerald-700">Votre position :</span>
            <span class="font-bold text-emerald-600">${percentileInfo?.percentile || 'N/A'}</span>
          </div>
          
          <div class="text-xs text-gray-600 text-center">
            Vous gagnez plus que <strong>${comparison.betterThanPercent}%</strong> des Québécois
          </div>
          
          ${nearbyJobs.length > 0 ? `
            <div class="space-y-2">
              <div class="text-xs font-medium text-gray-700 mb-2">Salaires similaires :</div>
              ${nearbyJobs.map(job => `
                <div class="flex items-center justify-between text-xs">
                  <span class="flex items-center">
                    <span class="mr-1">${job.emoji}</span>
                    ${job.title}
                  </span>
                  <span class="font-medium">${this.formatCurrency(job.salary)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to update social comparison:', error);
    }
  }

  async updateFinancialRecommendations(result) {
    try {
      const response = await fetch('/src/data/financialTips.json');
      const tipsData = await response.json();
      
      const recommendations = DataAnalyzer.generateFinancialRecommendations(
        result.basicNet,
        tipsData.savingsRecommendations,
        tipsData.budgetRules
      );

      const container = document.getElementById('financial-tips');
      const monthlyNet = result.basicNet / 12;

      let html = `
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="text-center p-2 bg-blue-50 rounded">
              <div class="font-semibold text-blue-700">CELIAPP</div>
              <div class="text-blue-600">${this.formatCurrency(recommendations.celiapp * 12)}/an</div>
            </div>
            <div class="text-center p-2 bg-purple-50 rounded">
              <div class="font-semibold text-purple-700">REER</div>
              <div class="text-purple-600">${this.formatCurrency(recommendations.rrsp * 12)}/an</div>
            </div>
            <div class="text-center p-2 bg-green-50 rounded">
              <div class="font-semibold text-green-700">CELI</div>
              <div class="text-green-600">${this.formatCurrency(recommendations.tfsa * 12)}/an</div>
            </div>
          </div>
          
          <div class="space-y-2">
            ${recommendations.tips.map(tip => `
              <div class="flex items-start text-xs">
                <span class="text-emerald-500 mr-2 mt-0.5">✓</span>
                <span class="text-emerald-700">${tip}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="pt-2 border-t border-emerald-200">
            <div class="text-xs text-emerald-600">
              💡 Fonds d'urgence recommandé : <strong>${this.formatCurrency(monthlyNet * 6)}</strong>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to update financial recommendations:', error);
    }
  }

  async updateHousingRecommendations(result) {
    try {
      const response = await fetch('/src/data/salaryData.json');
      const salaryData = await response.json();
      
      const monthlyNet = result.basicNet / 12;
      const maxHousing = monthlyNet * 0.30; // 30% rule
      const comfortableHousing = monthlyNet * 0.25; // More conservative

      const city = this.currentProvince === 'QC' ? 'montreal' : 'toronto';
      const housing = salaryData.housingCosts[city];

      const container = document.getElementById('housing-recommendations');

      let affordableOptions = [];
      if (maxHousing >= housing['1br']) affordableOptions.push(`🏠 1 chambre (${this.formatCurrency(housing['1br'])})`);
      if (maxHousing >= housing['2br']) affordableOptions.push(`🏡 2 chambres (${this.formatCurrency(housing['2br'])})`);
      if (maxHousing >= housing['3br']) affordableOptions.push(`🏘️ 3 chambres (${this.formatCurrency(housing['3br'])})`);

      let html = `
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="text-center p-2 bg-blue-50 rounded">
              <div class="font-semibold text-blue-700">Budget max</div>
              <div class="text-blue-600">${this.formatCurrency(maxHousing)}/mois</div>
              <div class="text-blue-500 text-xs">(30% du net)</div>
            </div>
            <div class="text-center p-2 bg-green-50 rounded">
              <div class="font-semibold text-green-700">Confortable</div>
              <div class="text-green-600">${this.formatCurrency(comfortableHousing)}/mois</div>
              <div class="text-green-500 text-xs">(25% du net)</div>
            </div>
          </div>
          
          ${affordableOptions.length > 0 ? `
            <div class="space-y-1">
              <div class="text-xs font-medium text-blue-700">Options à ${city === 'montreal' ? 'Montréal' : 'Toronto'} :</div>
              ${affordableOptions.map(option => `
                <div class="text-xs text-blue-600">${option}</div>
              `).join('')}
            </div>
          ` : `
            <div class="text-xs text-amber-600 p-2 bg-amber-50 rounded">
              ⚠️ Budget serré pour ${city === 'montreal' ? 'Montréal' : 'Toronto'}. Considérez la banlieue ou la colocation.
            </div>
          `}
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to update housing recommendations:', error);
    }
  }

  updateDynamicFAQ(result) {
    const container = document.getElementById('dynamic-faq');
    const faqSection = document.getElementById('dynamic-faq-section');
    
    faqSection.classList.remove('hidden');

    const monthlyNet = result.basicNet / 12;
    const effectiveRate = result.effectiveRate;
    const statusLabel = this.currentStatus === 'salarie' ? 'salarié' : 'freelance';

    const faqItems = [
      {
        question: `Pourquoi mon taux d'imposition effectif est de ${effectiveRate.toFixed(1)}% ?`,
        answer: `Votre taux effectif de ${effectiveRate.toFixed(1)}% inclut tous les impôts et cotisations. C'est normal car le système fiscal québécois est progressif : vous payez moins sur les premiers dollars gagnés.`
      },
      {
        question: `Est-ce que ${this.formatCurrency(monthlyNet)} par mois c'est bien ?`,
        answer: monthlyNet > 4000 
          ? `Avec ${this.formatCurrency(monthlyNet)}/mois, vous êtes dans une bonne situation financière. Vous pouvez épargner confortablement et avoir un bon niveau de vie.`
          : `${this.formatCurrency(monthlyNet)}/mois permet de couvrir les besoins essentiels. Concentrez-vous sur l'augmentation de vos revenus et l'épargne progressive.`
      },
      {
        question: `Quels avantages ai-je en tant que ${statusLabel} ?`,
        answer: this.currentStatus === 'salarie' 
          ? `Comme salarié, vous bénéficiez de l'assurance-emploi, d'avantages sociaux potentiels, et souvent d'un régime de retraite d'entreprise. Votre employeur paie aussi sa part des cotisations.`
          : `Comme freelance, vous avez plus de flexibilité et de déductions possibles. Vous ne cotisez pas à l'AE mais devez gérer vous-même vos avantages sociaux et votre retraite.`
      },
      {
        question: `Comment optimiser mes finances avec ce salaire ?`,
        answer: result.basicNet > 60000 
          ? `Avec votre niveau de revenu, maximisez vos REER pour réduire vos impôts. Diversifiez ensuite avec le CELI et explorez les investissements.`
          : `Commencez par un fonds d'urgence, puis le CELIAPP si vous voulez acheter. Augmentez progressivement vos cotisations REER/CELI.`
      }
    ];

    const html = faqItems.map(item => `
      <div class="faq-item">
        <div class="faq-question">${item.question}</div>
        <div class="faq-answer">${item.answer}</div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  renderProvinceComparison() {
    const qcResult = this.calculator.calculateBasicSalary(this.currentSalary, 'QC', this.currentStatus);
    const onResult = this.calculator.calculateBasicSalary(this.currentSalary, 'ON', this.currentStatus);

    const difference = onResult.basicNet - qcResult.basicNet;
    const betterProvince = difference > 0 ? 'Ontario' : 'Québec';
    const savingsAmount = Math.abs(difference);

    const container = document.getElementById('comparison-grid');
    
    container.innerHTML = `
      <div class="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h4 class="font-bold text-blue-800 mb-4">🍁 Québec</h4>
        <div class="space-y-2">
          <div class="text-2xl font-bold text-blue-600">${this.formatCurrency(qcResult.basicNet)}</div>
          <div class="text-sm text-blue-700">net annuel</div>
          <div class="text-xs text-blue-600">Taux effectif: ${qcResult.effectiveRate.toFixed(1)}%</div>
        </div>
      </div>
      
      <div class="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
        <h4 class="font-bold text-orange-800 mb-4">🏢 Ontario</h4>
        <div class="space-y-2">
          <div class="text-2xl font-bold text-orange-600">${this.formatCurrency(onResult.basicNet)}</div>
          <div class="text-sm text-orange-700">net annuel</div>
          <div class="text-xs text-orange-600">Taux effectif: ${onResult.effectiveRate.toFixed(1)}%</div>
        </div>
      </div>
      
      <div class="col-span-2 text-center p-4 bg-gray-50 rounded-xl">
        <div class="font-semibold text-gray-800">
          💡 ${betterProvince} vous fait économiser <strong>${this.formatCurrency(savingsAmount)}</strong> par année
        </div>
        <div class="text-sm text-gray-600 mt-1">
          ${difference > 0 ? 'L\'Ontario a des impôts plus bas' : 'Le Québec reste plus avantageux fiscalement'}
        </div>
      </div>
    `;
  }

  shareResult() {
    const url = UrlManager.generateShareableUrl({
      salary: this.currentSalary,
      status: this.currentStatus,
      province: this.currentProvince,
      hours: this.currentHours
    });

    navigator.clipboard.writeText(url).then(() => {
      const confirmation = document.getElementById('share-confirmation');
      confirmation.classList.remove('hidden');
      setTimeout(() => confirmation.classList.add('hidden'), 3000);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      // Fallback: show URL in alert
      alert(`Partagez ce lien: ${url}`);
    });
  }

  updateUrl() {
    const url = UrlManager.generateShareableUrl({
      salary: this.currentSalary,
      status: this.currentStatus,
      province: this.currentProvince,
      hours: this.currentHours
    });

    // Update URL without refreshing page
    window.history.replaceState({}, '', url);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('CA', '').trim();
  }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UltimateSalaryCalculator();
});

export { UltimateSalaryCalculator };