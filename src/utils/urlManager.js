export class UrlManager {
  static parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      salary: parseInt(params.get('s') || params.get('salaire')) || 0,
      status: params.get('st') || params.get('statut') || 'salarie',
      province: (params.get('p') || params.get('province') || 'QC').toUpperCase(),
      hours: parseInt(params.get('h') || params.get('heures')) || 35
    };
  }

  static updateUrl(params) {
    const url = new URL(window.location);
    url.searchParams.set('s', params.salary);
    url.searchParams.set('st', params.status);
    url.searchParams.set('p', params.province);
    url.searchParams.set('h', params.hours);
    
    window.history.replaceState({}, '', url);
  }

  static generateShareableUrl(params) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?s=${params.salary}&st=${params.status}&p=${params.province}&h=${params.hours}`;
  }

  static copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(() => {
      return true;
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    });
  }
}