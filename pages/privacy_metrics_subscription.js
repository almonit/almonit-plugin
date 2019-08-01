document
	.getElementById('authorize')
	.addEventListener('click', metricsAuthorize);
document.getElementById('deny').addEventListener('click', metricsDeny);

function metricsAuthorize() {
	promisify(browser.storage.local, 'get', ['ENSRedirectUrl']).then(function(
		item
	) {
		browser.storage.local.remove('ENSRedirectUrl');
		var sending = promisify(browser.runtime, 'sendMessage', [
			{
				permission: true,
				first_site: item.ENSRedirectUrl
			}
		]);
		sending;
		window.location.replace(item.ENSRedirectUrl);
	},
	err);
}

function metricsDeny() {
	promisify(browser.storage.local, 'get', ['ENSRedirectUrl']).then(function(
		item
	) {
		promisify(browser.storage.local, 'remove', ['ENSRedirectUrl']);
		var sending = promisify(browser.runtime, 'sendMessage', [
			{
				permission: false
			}
		]);
		sending;
		window.location.replace(item.ENSRedirectUrl);
	},
	err);
}

function err(msg) {
	console.warn(msg);
}
