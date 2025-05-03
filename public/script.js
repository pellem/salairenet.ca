document.addEventListener("DOMContentLoaded", function () {
  const inputAnnuel = document.getElementById('salaire-annuel');
  const inputMensuel = document.getElementById('salaire-mensuel');
  const inputHoraire = document.getElementById('salaire-horaire');
  const heuresInput = document.getElementById('heures-semaine');
  const statutSelect = document.getElementById('statut');
  const errorMsg = document.getElementById('form-error');
  const form = document.getElementById("form-salaire");
  const netMensuelEl = document.getElementById("net-mensuel-summary");

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
        const inputAnnuel = document.getElementById('salaire-annuel');
        const form = document.getElementById('form-salaire');
        inputAnnuel.value = val;
        form.requestSubmit();
      };
      

  inputAnnuel.addEventListener('input', () => syncSalaire('annuel'));
  inputMensuel.addEventListener('input', () => syncSalaire('mensuel'));
  inputHoraire.addEventListener('input', () => syncSalaire('horaire'));
  heuresInput.addEventListener('input', () => {
    if (inputAnnuel.value) syncSalaire('annuel');
  });

  // Ajout des classes vertes pour les salaires nets
  const netFields = ['net-annuel', 'net-mensuel', 'net-bimensuel', 'net-biweekly', 'net-horaire'];
  netFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('text-green-700', 'font-bold', 'transition-all', 'duration-300', 'ease-in-out');
    }
  });
  
    // Set statut from URL if applicable
  const urlParams = new URLSearchParams(window.location.search);
  const statutFromURL = urlParams.get("statut");
  if (statutFromURL && document.getElementById('statut')) {
    document.getElementById('statut').value = statutFromURL;
  }

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
    const revenuDynamique = document.getElementById('revenu-dynamique');
    if (revenuDynamique) {
      revenuDynamique.classList.remove('opacity-100');
      revenuDynamique.classList.add('opacity-0');
    
      requestAnimationFrame(() => {
        // Attendre une frame pour que la classe "opacity-0" prenne effet
        setTimeout(() => {
          revenuDynamique.textContent = `${formatMoney(revenuAnnuel)} $`;
          revenuDynamique.classList.remove('opacity-0');
          revenuDynamique.classList.add('opacity-100');
        }, 50);
      });
    }
    
    

    const statut = statutSelect.value;
    const taux = statut === 'freelance'
      ? { rrq: 0.18, rqap: 0.01, ae: 0, fed: 0.14, prov: 0.12 }
      : { rrq: 0.18, rqap: 0.01, ae: 0.012, fed: 0.14, prov: 0.12 };

    const deductions = {
      rrq: revenuAnnuel * taux.rrq,
      rqap: revenuAnnuel * taux.rqap,
      ae: revenuAnnuel * taux.ae,
      fed: revenuAnnuel * taux.fed,
      prov: revenuAnnuel * taux.prov
    };

    const totalDeduction = Object.values(deductions).reduce((acc, val) => acc + val, 0);
    const net = revenuAnnuel - totalDeduction;

    document.getElementById('net-annuel').textContent = formatMoney(net);
    document.getElementById('net-mensuel').textContent = formatMoney(net / 12);
    document.getElementById('net-bimensuel').textContent = formatMoney(net / 24);
    document.getElementById('net-biweekly').textContent = formatMoney(net / 26);
    document.getElementById('net-horaire').textContent = (net / (52 * heures)).toFixed(2) + ' $';

    const deductionFields = {
      'rrq-val': deductions.rrq,
      'rqap-val': deductions.rqap,
      'ae-val': deductions.ae,
      'fed-val': deductions.fed,
      'prov-val': deductions.prov
    };

    const pctFed = ((deductions.fed / revenuAnnuel) * 100).toFixed(1);
const pctProv = ((deductions.prov / revenuAnnuel) * 100).toFixed(1);

const fiscalText = `Tu paies <strong class="text-red-700">${pctFed}%</strong> au fédéral et <strong class="text-red-700">${pctProv}%</strong> au Québec sur ton revenu brut.`;

const resumeFiscal = document.getElementById('resume-fiscal');
if (resumeFiscal) resumeFiscal.innerHTML = fiscalText;


    for (const [id, value] of Object.entries(deductionFields)) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = formatMoney(value);
        el.classList.add('text-red-700', 'font-semibold', 'transition-all', 'duration-300', 'ease-in-out');
      }
    }
    

    const res = document.getElementById('resultat');
    if (res) {
      res.classList.remove('hidden');
      window.scrollTo({ top: res.offsetTop - 60, behavior: 'smooth' });
    }

    const oldComparatif = document.getElementById('comparatif-moyenne');
    if (oldComparatif) oldComparatif.remove();
    

const netMensuel = net / 12;
if (netMensuelEl) netMensuelEl.textContent = formatMoney(netMensuel);

// 👉 COMPARAISON AVEC LA MOYENNE QUÉBÉCOISE
const moyenneQC = 56000;
const ecart = Math.abs(revenuAnnuel - moyenneQC);
const estAuDessus = revenuAnnuel > moyenneQC;

const phrase = `
  <strong>Revenu moyen au Québec :</strong> ${formatMoney(moyenneQC)} $<br>
  Ton revenu est <strong class="${estAuDessus ? 'text-green-700' : 'text-red-700'}">
  ${estAuDessus ? formatMoney(ecart) + ' $ au-dessus' : formatMoney(ecart) + ' $ en dessous'}</strong>
  de la moyenne québécoise.
`;

const comparaisonContainer = document.getElementById("comparatif-dynamique");
if (comparaisonContainer) comparaisonContainer.innerHTML = phrase;


    const conseilsList = document.getElementById("conseils-dynamiques");
    if (conseilsList) {
      const celipapp = (netMensuel * 0.1).toFixed(0);
      const epargneUrgence = (netMensuel * 5).toFixed(0);
      const loyerMax = (netMensuel * 0.35).toFixed(0);
      const pourcentagePris = ((totalDeduction / revenuAnnuel) * 100).toFixed(1);
      const impotsMensuels = formatMoney(totalDeduction / 12);

      conseilsList.innerHTML = `
        <li>💡 Mets environ <strong>${celipapp} $</strong> par mois dans un <strong>CELIAPP</strong> si tu veux acheter une propriété d’ici 5 ans.</li>
        ${
        net > 50000 ?
        '<li>📈 Puisque ton revenu net dépasse 50 000 $, cotise à ton <strong>REER</strong> pour réduire tes impôts.</li>' :
        ''
    }
        <li>🔐 Prévois une épargne d’urgence d’environ <strong>${epargneUrgence} $</strong> (3 à 6 mois de dépenses courantes).</li>
        <li>📅 Optimise ton retour d’impôt en cotisant tôt dans l’année, pas juste en mars avant la date limite !</li>
        <li>🏠 Essaie de ne pas dépasser <strong>${loyerMax} $</strong>/mois pour ton logement (règle des 35%).</li>
        <li class="text-gray-600 pt-2">Sur <strong>${formatMoney(netMensuel + totalDeduction / 12)}</strong> que tu génères chaque mois, l'État te prend <strong class="text-red-700">${impotsMensuels}</strong> soit <strong class="text-red-700">${pourcentagePris}%</strong>.</li>
      `;
    }
  });
});