var url = new URL(window.location.href);
var ensDomain = url.searchParams.get('redirect');
var ensPath = url.searchParams.get('path');

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

promisify(browser.runtime, 'sendMessage', [
	{
		resolveUrl: [ensDomain, ensPath]
	}
]).then(response => {
	window.location.href = response;
});
