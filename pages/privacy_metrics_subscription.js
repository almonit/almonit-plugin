document
	.getElementById('authorize')
	.addEventListener('click', metricsAuthorize);
document.getElementById('deny').addEventListener('click', metricsDeny);

let isFirefox;

function checkBrowser() {
	if (typeof browser === 'undefined') {
		browser = chrome;
	} else {
		isFirefox = true;
	}
	return;
}

checkBrowser();

/**
 * [promisify description]
 * @param  {[function]}     api         [description]
 * @param  {[Array]}        args        [description]
 * @return {[function]}                 [description]
 *
 * @example
 * promisify(firefoxFunc, [1,2,3]).then(res => {})
 *
 * promisify(chromeFunc, [1,2,3]).then(res => {})
 */
const promisify = (api, method, args) => {
	const callBack = (resolve, reject, result) => {
		if (browser.runtime.lastError) {
			reject(chrome.runtime.lastError);
			return;
		}

		resolve(result);
	};

	return new Promise((resolve, reject) => {
		if (!isFirefox)
			api[method](
				method === 'set' ? args[0] : args,
				callBack.bind(this, resolve, reject)
			);
		else api[method](...args).then(callBack.bind(this, resolve, reject));
	});
};

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
