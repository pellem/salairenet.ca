// src/lib/generatePaths.ts

export function getStaticPaths() {
  const salaires = [
    33488, // salaire minimum annuel
    31696, 32884, 35000, 40000, 42884, // revenus viables
    45000, 50000, 52000, 55000, 60000, 65000, 70000,
    72800, 75000, 80000, 85000, 90000, 95000, 100000 // salaires populaires
  ];

  const statuts = ['salarie', 'freelance'];

  return statuts.flatMap((statut) =>
    salaires.map((salaire) => ({
      params: {
        statut,
        salaire: salaire.toString()
      }
    }))
  );
}
