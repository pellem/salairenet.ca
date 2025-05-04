// 💼 Simulateur Brut ↔ Net 2025 – avec support freelance

document.addEventListener("DOMContentLoaded", function () {
  const inputAnnuel = document.getElementById('salaire-annuel');
  const inputMensuel = document.getElementById('salaire-mensuel');
  const inputHoraire = document.getElementById('salaire-horaire');
  const heuresInput = document.getElementById('heures-semaine');
  const statutSelect = document.getElementById('statut');
  const errorMsg = document.getElementById('form-error');
  const form = document.getElementById("form-salaire");
  const netMensuelEl = document.getElementById("net-mensuel-summary");


  function calcFederalTax(income) {
    const brackets = [
      { limit: 57375, rate: 0.15 },
      { limit: 114750, rate: 0.205 },
      { limit: 177882, rate: 0.26 },
      { limit: 253414, rate: 0.29 },
      { limit: Infinity, rate: 0.33 }
    ];
    let tax = 0, prev = 0;
    for (const b of brackets) {
      const taxable = Math.min(income, b.limit) - prev;
      if (taxable > 0) {
        tax += taxable * b.rate;
        prev = b.limit;
      } else break;
    }
    return tax;
  }
  

  
  function calcProvincialTax(income) {
    const brackets = [
      { limit: 53255, rate: 0.14 },
      { limit: 106495, rate: 0.19 },
      { limit: 129590, rate: 0.24 },
      { limit: Infinity, rate: 0.2575 }
    ];
    let tax = 0, prev = 0;
    for (const b of brackets) {
      const taxable = Math.min(income, b.limit) - prev;
      if (taxable > 0) {
        tax += taxable * b.rate;
        prev = b.limit;
      } else break;
    }
    return tax;
  }
  
  
  
  function calcRRQ(income, isFreelance) {
    const taux = isFreelance ? 0.128 : 0.064;
    const maxRevenu = 71200;
    const exemption = 3500;
    const assurable = Math.max(0, Math.min(income, maxRevenu) - exemption);
    return assurable * taux;
  }
  
  
  function calcRQAP(income, isFreelance) {
    const taux = isFreelance ? 0.00878 : 0.00494;
    const maxRevenu = 98000;
    return Math.min(income, maxRevenu) * taux;
  }
  
  
  function calcAE(income, isFreelance) {
    if (isFreelance) return 0;
    const taux = 0.0131;
    const maxCotisation = 860.67;
    const maxRevenu = 65700;
    return Math.min(income, maxRevenu) * taux > maxCotisation ? maxCotisation : Math.min(income, maxRevenu) * taux;
  }
  
  

  function syncSalaire(changed) {
    const heures = parseFloat(heuresInput.value);
    if (changed === 'annuel') {
      const annuel = parseFloat(inputAnnuel.value);
      if (!isNaN(annuel)) {
        inputMensuel.value = (annuel / 12).toFixed(2);
        inputHoraire.value = (annuel / (heures * 52)).toFixed(2);
      }
    } else if (changed === 'mensuel') {
      const mensuel = parseFloat(inputMensuel.value);
      if (!isNaN(mensuel)) {
        inputAnnuel.value = (mensuel * 12).toFixed(2);
        inputHoraire.value = ((mensuel * 12) / (heures * 52)).toFixed(2);
      }
    } else if (changed === 'horaire') {
      const horaire = parseFloat(inputHoraire.value);
      if (!isNaN(horaire)) {
        inputAnnuel.value = (horaire * heures * 52).toFixed(2);
        inputMensuel.value = ((horaire * heures * 52) / 12).toFixed(2);
      }
    }
  }

  function formatMoney(val) {
    return parseFloat(val).toLocaleString('fr-CA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  window.remplirSalaire = function(val) {
    inputAnnuel.value = val;
    form.requestSubmit();
  };

  inputAnnuel.addEventListener('input', () => syncSalaire('annuel'));
  inputMensuel.addEventListener('input', () => syncSalaire('mensuel'));
  inputHoraire.addEventListener('input', () => syncSalaire('horaire'));
  heuresInput.addEventListener('input', () => {
    if (inputAnnuel.value) syncSalaire('annuel');
  });

  const netFields = ['net-annuel', 'net-mensuel', 'net-bimensuel', 'net-biweekly', 'net-horaire'];
  netFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('text-green-700', 'font-bold', 'transition-all', 'duration-300', 'ease-in-out');
  });

  // ➕ Affichage conditionnel FAQ freelance
  const faqFreelance = document.getElementById('faq-freelance');
  const h2 = document.querySelector('h2.text-3xl');
  function updateFreelanceMode() {
    const isFreelance = statutSelect.value === 'freelance';
    if (faqFreelance) faqFreelance.classList.toggle('hidden', !isFreelance);
    if (h2) h2.innerHTML = isFreelance ? "Calculez votre <strong>salaire net freelance</strong> au Québec (2025)" : "Calculez votre salaire net<br class=\"sm:hidden\"/> au Québec (2025)";
  }
  statutSelect.addEventListener('change', updateFreelanceMode);
  updateFreelanceMode();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const brut = parseFloat(inputAnnuel.value);
    const mensuel = parseFloat(inputMensuel.value);
    const horaire = parseFloat(inputHoraire.value);
    const heures = parseFloat(heuresInput.value);

    if ((isNaN(brut) || brut <= 0) && (isNaN(mensuel) || mensuel <= 0) && (isNaN(horaire) || horaire <= 0)) {
      errorMsg.classList.remove('hidden');
      return;
    }
    errorMsg.classList.add('hidden');

    const revenuAnnuel = !isNaN(brut) ? brut : (!isNaN(mensuel) ? mensuel * 12 : horaire * heures * 52);
    const statut = statutSelect.value;

      const isFreelance = statut === 'freelance';

      const rrq = calcRRQ(revenuAnnuel, isFreelance);
      const rqap = calcRQAP(revenuAnnuel);
      const ae = calcAE(revenuAnnuel, isFreelance);
      const fed = calcFederalTax(revenuAnnuel);
      const prov = calcProvincialTax(revenuAnnuel);

      // 💡 Affichage détaillé des tranches d'imposition
function generateBracketLines(income, brackets) {
  let result = [], prev = 0;
  for (const b of brackets) {
    const taxable = Math.min(income, b.limit) - prev;
    if (taxable > 0) {
      const montant = taxable * b.rate;
      result.push({
        range: `${formatMoney(taxable)} $`,
        rate: (b.rate * 100).toFixed(1) + ' %',
        tax: `${formatMoney(montant)} $`
      });
      prev = b.limit;
    } else break;
  }
  return result;
}

function renderBracketDetails(containerId, totalId, brackets, income, labelColor) {
  const container = document.getElementById(containerId);
  const totalEl = document.getElementById(totalId);
  if (!container || !totalEl) return;

  const lines = generateBracketLines(income, brackets);
  container.innerHTML = lines.map(l =>
    `<li><span class="font-medium">${l.range}</span> taxés à <span class="font-medium">${l.rate}</span> → <span class="font-semibold">${l.tax}</span></li>`
  ).join('\n');

  const total = lines.reduce((sum, l) => sum + parseFloat(l.tax.replace(/\s| |\$/g, '')), 0);
  totalEl.textContent = `Total : ${formatMoney(total)} $`;
  totalEl.classList.add(labelColor);
}

renderBracketDetails('federal-brackets', 'federal-total', [
  { limit: 57375, rate: 0.15 },
  { limit: 114750, rate: 0.205 },
  { limit: 177882, rate: 0.26 },
  { limit: 253414, rate: 0.29 },
  { limit: Infinity, rate: 0.33 }
], revenuAnnuel, 'text-red-700');


renderBracketDetails('provincial-brackets', 'provincial-total', [
  { limit: 53255, rate: 0.14 },
  { limit: 106495, rate: 0.19 },
  { limit: 129590, rate: 0.24 },
  { limit: Infinity, rate: 0.2575 }
], revenuAnnuel, 'text-blue-700');


const totalTaxRateEl = document.getElementById('total-tax-rate');
if (totalTaxRateEl) {
  const tauxTotal = ((fed + prov) / revenuAnnuel * 100).toFixed(1);
  totalTaxRateEl.textContent = `${tauxTotal} %`;
}

      
      const deductions = { rrq, rqap, ae, fed, prov };
      
    const totalDeduction = Object.values(deductions).reduce((a, b) => a + b, 0);
    const net = revenuAnnuel - totalDeduction;

    const revenuDynamique = document.getElementById('revenu-dynamique');
    if (revenuDynamique) {
      revenuDynamique.textContent = `${formatMoney(revenuAnnuel)} $`; // <- AJOUT IMMEDIAT
      revenuDynamique.classList.remove('opacity-100');
      revenuDynamique.classList.add('opacity-0');
      requestAnimationFrame(() => {
        setTimeout(() => {
          revenuDynamique.textContent = `${formatMoney(revenuAnnuel)} $`; // <- POUR L’ANIMATION
          revenuDynamique.classList.remove('opacity-0');
          revenuDynamique.classList.add('opacity-100');
        }, 50);
      });
    }
    

    document.getElementById('net-annuel').textContent = formatMoney(net);
    document.getElementById('net-mensuel').textContent = formatMoney(net / 12);
    document.getElementById('net-bimensuel').textContent = formatMoney(net / 24);
    document.getElementById('net-biweekly').textContent = formatMoney(net / 26);
    document.getElementById('net-horaire').textContent = (net / (52 * heures)).toFixed(2) + ' $';

    for (const [id, val] of Object.entries({
      'rrq-val': deductions.rrq,
      'rqap-val': deductions.rqap,
      'ae-val': deductions.ae,
      'fed-val': deductions.fed,
      'prov-val': deductions.prov
    })) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = formatMoney(val);
        el.classList.add('text-red-700', 'font-semibold');
      }
    }

    const resumeFiscal = document.getElementById('resume-fiscal');
    if (resumeFiscal) {
      resumeFiscal.innerHTML = `Tu paies <strong class="text-red-700">${((deductions.fed / revenuAnnuel) * 100).toFixed(1)}%</strong> au fédéral et <strong class="text-red-700">${((deductions.prov / revenuAnnuel) * 100).toFixed(1)}%</strong> au Québec.`;
    }

    const res = document.getElementById('resultat');
    if (res) {
      res.classList.remove('hidden');
      window.scrollTo({ top: res.offsetTop - 60, behavior: 'smooth' });
    }

    const moyenneQC = 56000;
    const ecart = Math.abs(revenuAnnuel - moyenneQC);
    const estAuDessus = revenuAnnuel > moyenneQC;
    const comp = document.getElementById("comparatif-dynamique");
    if (comp) {
      comp.innerHTML = `<strong>Revenu moyen au Québec :</strong> ${formatMoney(moyenneQC)} $<br>Ton revenu est <strong class="${estAuDessus ? 'text-green-700' : 'text-red-700'}">${formatMoney(ecart)} $ ${estAuDessus ? 'au-dessus' : 'en dessous'}</strong> de la moyenne.`;
    }

    const conseilsList = document.getElementById("conseils-dynamiques");
    if (conseilsList) {
      const netMensuel = net / 12;
      if (netMensuelEl) {
        netMensuelEl.textContent = formatMoney(netMensuel);
      }      
      const celipapp = (netMensuel * 0.1).toFixed(0);
      const epargneUrgence = (netMensuel * 5).toFixed(0);
      const loyerMax = (netMensuel * 0.35).toFixed(0);
      const pourcentagePris = ((totalDeduction / revenuAnnuel) * 100).toFixed(1);
      const impotsMensuels = formatMoney(totalDeduction / 12);

      const listePaliers = document.getElementById('liste-paliers');
if (listePaliers) {
  const fedBrackets = [
    { label: '15 %', rate: 0.15, limit: 57375 },
    { label: '20,5 %', rate: 0.205, limit: 114750 },
    { label: '26 %', rate: 0.26, limit: 177882 },
    { label: '29 %', rate: 0.29, limit: 253414 },
    { label: '33 %', rate: 0.33, limit: Infinity }
  ];
  const provBrackets = [
    { label: '14 %', rate: 0.14, limit: 53255 },
    { label: '19 %', rate: 0.19, limit: 106495 },
    { label: '24 %', rate: 0.24, limit: 129590 },
    { label: '25,75 %', rate: 0.2575, limit: Infinity }
  ];

  const explainBrackets = (brackets, income) => {
    let html = '';
    let prev = 0;
    for (const b of brackets) {
      const amount = Math.min(income, b.limit) - prev;
      if (amount > 0) {
        const taxe = amount * b.rate;
        html += `<li>💸 <strong>${formatMoney(taxe)} $</strong> imposés à <strong>${b.label}</strong> sur <span class="text-gray-600">${formatMoney(amount)} $</span></li>`;
        prev = b.limit;
      }
    }
    return html;
  };

  listePaliers.innerHTML = `
    <h4 class="font-semibold text-gray-800 mt-4">Impôt fédéral :</h4>
    ${explainBrackets(fedBrackets, revenuAnnuel)}
    <h4 class="font-semibold text-gray-800 mt-4">Impôt provincial :</h4>
    ${explainBrackets(provBrackets, revenuAnnuel)}
  `;
  
}


      conseilsList.innerHTML = `
        <li>💡 Mets environ <strong>${celipapp} $</strong> par mois dans un <strong>CELIAPP</strong>.</li>
        ${net > 50000 ? '<li>📈 Pense au <strong>REER</strong> pour optimiser tes impôts.</li>' : ''}
        <li>🔐 Vise une épargne d’urgence de <strong>${epargneUrgence} $</strong>.</li>
        <li>🏠 Loyer idéal : <strong>${loyerMax} $</strong>/mois max.</li>
        <li class="text-gray-600 pt-2">Sur <strong>${formatMoney(netMensuel + totalDeduction / 12)}</strong> générés/mois, l’État en prend <strong class="text-red-700">${impotsMensuels}</strong> soit <strong class="text-red-700">${pourcentagePris}%</strong>.</li>`;
    }

    // ✅ Mettre à jour l'URL avec les paramètres actuels (partageables)
const params = new URLSearchParams();
params.set('salaire', revenuAnnuel.toFixed(0));
params.set('statut', statut);
const newUrl = `${window.location.pathname}?${params.toString()}`;
window.history.replaceState({}, '', newUrl);


    function renderTaxDetails(brackets, income, targetEl, totalEl) {
      let html = '';
      let totalTax = 0;
      let prev = 0;
    
      for (const b of brackets) {
        const amount = Math.min(income, b.limit) - prev;
        if (amount <= 0) break;
        const taxe = amount * b.rate;
        totalTax += taxe;
        html += `<li>${formatMoney(amount)} $ taxés à ${(b.rate * 100).toFixed(1)} % → <strong>${formatMoney(taxe)} $</strong></li>`;
        prev = b.limit;
      }
    
      document.getElementById(targetEl).innerHTML = html;
      document.getElementById(totalEl).innerHTML = `≈ ${formatMoney(totalTax)} $ d’impôts`;
      return totalTax;
    }
    
    const breakdown = document.getElementById('breakdown-details');
    if (breakdown) {
      const fedTax = renderTaxDetails([
        { limit: 57375, rate: 0.1253 },
        { limit: 114750, rate: 0.1712 },
        { limit: 177882, rate: 0.2171 },
        { limit: 253414, rate: 0.2422 },
        { limit: Infinity, rate: 0.2756 }
      ], revenuAnnuel, 'federal-brackets', 'federal-total');
    
      const provTax = renderTaxDetails([
        { limit: 53255, rate: 0.14 },
        { limit: 106495, rate: 0.19 },
        { limit: 129590, rate: 0.24 },
        { limit: Infinity, rate: 0.2575 }
      ], revenuAnnuel, 'provincial-brackets', 'provincial-total');
    
      document.getElementById('total-tax-rate').textContent = `${((totalDeduction / revenuAnnuel) * 100).toFixed(1)} %`;
      breakdown.classList.remove('hidden');
    }
    
  });

// 🔁 Préremplissage depuis l'URL : ?salaire=62000&statut=freelance
const url = new URLSearchParams(window.location.search);
const salaireParam = url.get('salaire');
const statutParam = url.get('statut');

const btnShare = document.getElementById('btn-share');
const confirmShare = document.getElementById('share-confirm');

if (btnShare && confirmShare) {
  btnShare.addEventListener('click', async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      confirmShare.classList.remove('hidden');
      setTimeout(() => confirmShare.classList.add('hidden'), 2500);
    } catch (err) {
      console.error("Échec de la copie dans le presse-papier :", err);
      confirmShare.textContent = "Erreur lors de la copie";
      confirmShare.classList.remove('hidden');
    }
  });
}


if (
  salaireParam &&
  inputAnnuel instanceof HTMLInputElement &&
  form instanceof HTMLFormElement &&
  statutSelect instanceof HTMLSelectElement
) {
  const salaireNum = parseFloat(salaireParam);

  if (!isNaN(salaireNum) && salaireNum > 0) {
    inputAnnuel.value = salaireNum.toString();

    if (statutParam === 'freelance' || statutParam === 'salarie') {
      statutSelect.value = statutParam;
      updateFreelanceMode?.(); // applique l'UI en fonction du statut
    }

    syncSalaire?.('annuel'); // met à jour les champs
    form.requestSubmit();    // soumet le formulaire
  }
}

  
  
});
