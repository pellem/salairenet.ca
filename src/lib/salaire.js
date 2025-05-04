export function calculerSalaireNet(salaire) {
  const rrq = Math.min(Math.max(0, salaire - 3500), 71200 - 3500) * 0.064;
  const rqap = Math.min(salaire, 98000) * 0.00494;
  const ae = Math.min(salaire, 65700) * 0.0131;

  const fed = calculerPalier(salaire, [
    { limit: 57375, rate: 0.15 },
    { limit: 114750, rate: 0.205 },
    { limit: 177882, rate: 0.26 },
    { limit: 253414, rate: 0.29 },
    { limit: Infinity, rate: 0.33 }
  ]);

  const prov = calculerPalier(salaire, [
    { limit: 53255, rate: 0.14 },
    { limit: 106495, rate: 0.19 },
    { limit: 129590, rate: 0.24 },
    { limit: Infinity, rate: 0.2575 }
  ]);

  const total = rrq + rqap + ae + fed + prov;
  return {
    net: Math.round(salaire - total),
    rrq: Math.round(rrq),
    rqap: Math.round(rqap),
    ae: Math.round(ae),
    fed: Math.round(fed),
    prov: Math.round(prov)
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
