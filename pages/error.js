const urlDOM = document.getElementById('ensUrl');
var url = new URL(window.location.href);
var fallbackUrl = url.searchParams.get('fallback');
urlDOM.href = 'https://app.ens.domains/name/' + fallbackUrl;