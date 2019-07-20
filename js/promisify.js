/**
 * [promisify description]
 * @param  {[function]} 	api    		[description]
 * @param  {[Array]} 		args   		[description]
 * @return {[function]}        			[description]
 *
 * @example
 * promisify(firefoxFunc, [1,2,3]).then(res => {}) //firefox api
 *
 * promisify(chromeFunc, [1,2,3]).then(res => {}) //chrome api
 */
'use strict';
const isChrome = !!chrome;
if (isChrome) {
	browser = chrome;
	browser.isChrome = isChrome;
	browser.promisify = promisify;
	Object.freeze(browser);
}

function promisify(api, args) {
	//browser.storage.local.get('settings')
	function callBack(resolve, reject, result) {
		console.log("resolve, reject, result", resolve, reject, result);
		if (browser.runtime.lastError) {
			reject(chrome.runtime.lastError);
			return;
		}
		if (result) resolve(result);
		reject('error');
	}

	return new Promise((resolve, reject) => {
		if (!isFF) api.call(null, args, callBack.bind(null, resolve, reject));
		else api.call(null, ...args).then(callBack.bind(null, resolve, reject));
	});
}