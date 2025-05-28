export function calculerSalaireNet(salaire, statut = 'salarie', province = 'QC') {
  const isFreelance = statut === 'freelance';
  
  // RRQ/CPP - Different rates for QC vs ON
  const pensionRate = isFreelance ? 0.128 : 0.064;
  let pension;
  
  if (province === 'QC') {
    // RRQ
    pension = Math.min(Math.max(0, salaire - 3500), 71200 - 3500) * pensionRate;
  } else {
    // CPP for Ontario
    pension = Math.min(Math.max(0, salaire - 3500), 71300 - 3500) * pensionRate;
  }

  // RQAP (Quebec only) vs EI rates
  let rqap = 0;
  let ae = 0;
  
  if (province === 'QC') {
    rqap = Math.min(salaire, 98000) * (isFreelance ? 0.00878 : 0.00494);
    ae = isFreelance ? 0 : Math.min(salaire, 65700) * 0.0131;
  } else {
    // Ontario - only EI, no RQAP
    ae = isFreelance ? 0 : Math.min(salaire, 65700) * 0.0131;
  }

  // Federal tax (same for both provinces)
  const fed = calculerPalier(salaire, [
    { limit: 57375, rate: 0.15 },
    { limit: 114750, rate: 0.205 },
    { limit: 177882, rate: 0.26 },
    { limit: 253414, rate: 0.29 },
    { limit: Infinity, rate: 0.33 }
  ]);

  // Provincial tax - DIFFERENT RATES
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

  const prov = calculerPalier(salaire, provincialRates[province]);

  const total = pension + rqap + ae + fed + prov;
  
  return {
    net: Math.round(salaire - total),
    pension: Math.round(pension), // RRQ or CPP
    rqap: Math.round(rqap),
    ae: Math.round(ae),
    fed: Math.round(fed),
    prov: Math.round(prov),
    province: province
  };
}

function calculerPalier(income, brackets) {
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
