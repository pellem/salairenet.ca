document.addEventListener("DOMContentLoaded", function () {
  const statutSelect = document.getElementById('statut');
  if (statutSelect) {
    statutSelect.addEventListener('change', () => {
      if (statutSelect.value === 'freelance' && !window.location.pathname.includes('freelance')) {
        window.location.href = '/freelance';
      }
    });
  }
});