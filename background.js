/**
 * settings
 */
const PAGE_404 = browser.runtime.getURL('pages/error.html');
const PAGE_REDIRECT = browser.runtime.getURL('pages/redirect.html');
const PAGE_SETTINGS = browser.runtime.getURL('pages/settings.html');
const settingsUrl = 'update.extension.almonit.eth';

let localENS = {}; // a local ENS of all names we discovered

let ipfsGateways = false;
let skynetGateways = false;
let ethereumGateways = false;

let redirectAddress = null;
let checkedforUpdates = false;

/**
 * Catch '.ens' requests, read ipfs address from Ethereum and redirect to ENS
 */
browser.webRequest.onBeforeRequest.addListener(
	listener,
	{ urls: ['http://*.eth/*', 'https://*.eth/*'], types: ['main_frame'] },
	['blocking']
);

function listener(details) {
	const [ensDomain, ensPath] = urlDomain(details.url);
	if (!isFirefox) {
		redirectAddress = { ensDomain, ensPath };
		return { redirectUrl: PAGE_REDIRECT };
	}
	// if error in retrieving Contenthash, try general ENS content field
	return WEB3ENS.getContenthash(ensDomain)
		.then(
			function(address) {
				if (address !== "0x")
					return handleENSContenthash(address, ensDomain, ensPath);
				else {
					return getSkynet(ensDomain, ensPath);
				}
			},
			function(error) {
				return WEB3ENS.getContent(ensDomain).then(
					function(content) {
						return handleENSContent(content, ensDomain, ensPath);
					}
				)
			.catch(notFound.bind(null, ensDomain));
			}
		)
		.catch(notFound.bind(null, ensDomain));
}

/**
 * Anonymous default settings update (ipfs gateways list etc)
 */
browser.webRequest.onCompleted.addListener(handleRequestComplete, {
	urls: ['http://*/*ipfs*/*', 'https://*/*ipfs*/*'],
	types: ['main_frame']
});

function handleRequestComplete(e) {
	let statusDigit = ('' + e.statusCode)[0];
	if (!checkedforUpdates && statusDigit == 2 && autoGatewaysUpdate) {
		let [domain, path] = urlDomain(e.url);

		checkedforUpdates = true;
		initSettingsUpgrade(domain);
	}

	return { responseHeaders: e.responseHeaders };
}

function initSettingsUpgrade(domain) {
	WEB3ENS.getContenthash(settingsUrl).then(
		function(address) {
			let hex = address.slice(14);
			let ipfsHash = hextoIPFS(hex);
			let ipfsAddress = 'https://' + domain + '/ipfs/' + ipfsHash;
			loadHttpUrl(ipfsAddress, settingsUpgrade);
		},
		function(error) {
			err(error);
		}
	);
}

function settingsUpgrade(newSettings) {
	try {
		newSettings = JSON.parse(newSettings);
	} catch (e) {
		return false;
	}

	promisify(browser.storage.local, 'get', ['settings']).then(function(item) {
		let settings = item.settings;

		settings.ethereumGateways = new Gateways(settings.ethereumGateways);
		settings.ipfsGateways = new Gateways(settings.ipfsGateways);
		settings.skynetGateways = new Gateways(settings.skynetGateways);

		settings.ethereumGateways.setDefaultGateways(newSettings.ethereumGateways);
		settings.ipfsGateways.setDefaultGateways(newSettings.ipfsGateways);
		settings.skynetGateways.setDefaultGateways(newSettings.skynetGateways);

		promisify(browser.storage.local, 'set', [{ settings }]);

		ethereumGateways = settings.ethereumGateways;
		ipfsGateways = settings.ipfsGateways;
		skynetGateways = settings.ipfsGateways;
	});
}

/**
 * Error handling
 */
browser.webRequest.onErrorOccurred.addListener(logError, {
	urls: ['http://*/*ipfs*', 'https://*/*ipfs*'],
	types: ['main_frame']
});

function logError(e) {
	let [domain, path] = urlDomain(e.url);
	let currentGateway = normalizeUrl(ipfsGateways.currentGateway.address, {
		stripProtocol: true
	});

	if (domain == currentGateway)
		promisify(browser.storage.local, 'get', ['settings']).then(
			storage => handleGatewayError(storage, e.url, e.tabId),
			err
		);
}

/**
 * Handle broken IPFS gateway
 */
browser.webRequest.onHeadersReceived.addListener(
	handleHeaderReceived,
	{ urls: ['http://*/*ipfs*', 'https://*/*ipfs*'], types: ['main_frame'] },
	['blocking', 'responseHeaders']
);

function handleHeaderReceived(e) {
	let statusCode = '' + e.statusCode;
	if (statusCode.startsWith(5)) {
		let [domain, path] = urlDomain(e.url);
		let currentGateway = normalizeUrl(ipfsGateways.currentGateway.address, {
			stripProtocol: true
		});

		if (domain == currentGateway)
			promisify(browser.storage.local, 'get', ['settings']).then(
				storage => handleGatewayError(storage, e.url, e.tabId),
				err
			);
	}

	return { responseHeaders: e.responseHeaders };
}

function handleGatewayError(storage, url, tab) {
	// if RANDOM choose a new gateway, otherwise do nothing
	if (storage.settings.ipfsGateways.option == 'random') {
		let settings = storage.settings;
		
		// set a new current gateway and update settings storage
		settings.ipfsGateways = new Gateways(settings.ipfsGateways);
		settings.ipfsGateways.setCurrentGateway();
		promisify(browser.storage.local, 'set', [{ settings }]);
		ipfsGateways = settings.ipfsGateways;

		//redirect
		let [fullPath, _, hash] = separateIpfsUrl(url);
		if (localENS[hash]) {
			let ipfsAddress = ipfsGateways.currentGateway.address + fullPath;
			browser.tabs.update(tab, { url: ipfsAddress });
		}
	}
}

/**
 * communicating with frontend scripts
 */
browser.runtime.onMessage.addListener(messagefromFrontend);

function messagefromFrontend(request, sender, sendResponse) {
	request = Array.isArray(request) ? request[0] : request;
	if (!!request.normalizeURL) {
		const normalizedUrl = normalizeUrl(request.normalizeURL, {
			forceHttp: true
		});
		sendResponse({ response: normalizedUrl });
	} else if (localENS[request.ipfsAddress]) {
		sendResponse({ response: localENS[request.ipfsAddress] });
	} else if (!!request.permission) {
		let ipfsLocation = request.first_site.lastIndexOf('ipfs');
		let ipfsAddress = request.first_site.substring(
			ipfsLocation + 5,
			request.first_site.length
		);
		metrics.add(localENS[ipfsAddress]);

		//update local settings
		metricsPermission = request.permission;

		//update stored settings
		promisify(browser.storage.local, 'get', ['settings']).then(function(
			item
		) {
			let settings = item.settings;
			settings.metricsPermission = request.permission;
			promisify(browser.storage.local, 'set', [{ settings }]);
		},
		err);
	} else if (!!request.settings) {
		let settingsTab = browser.tabs.create({
			url: PAGE_SETTINGS
		});
	} else if (!!request.reloadSettings) {
		loadSettings(false);
	} else if (!!request.resolveUrl) {
		const { ensDomain, ensPath } = redirectAddress;
		WEB3ENS.getContenthash(ensDomain)
			.then(
				function(address) {
					const resolvedUrl = handleENSContenthash(
						address,
						ensDomain,
						ensPath
					);
					resolvedUrl.then(({ redirectUrl }) =>
						sendResponse(redirectUrl)
					);
				},
				function(error) {
					const resolvedUrl = getENSContent(ensDomain, ensPath);
					resolvedUrl.then(({ redirectUrl }) =>
						sendResponse(redirectUrl)
					);
				}
			)
			.catch(() => {
				sendResponse(PAGE_404 + '?fallback=' + ensDomain);
			})
			.finally(() => {
				redirectAddress = null;
			});
	}
	return true;
}

/**
 * auxillary functions
 */

/**
 * [separateIpfsUrl separates ipfs path from url
 * @param  {[type]} url [description]
 * @return {[type]}      [description]
 */
function separateIpfsUrl(url) {
	const regx = /(\/ipfs\/)(\b\w{46}\b)(?:\/|)([\w\-\.]+[^#?\s]+|)(\?[\w\-\.]+[^#?\s]+|)(\#.+|)/gi;
	const [fullPath, pathname, hash, subPath, query, fragment] = regx.exec(url);
	return [fullPath, pathname, hash, subPath, query, fragment];
}

/**
 * load a url into a variable and calls callback cb with this variable as a parameter
 * @param  {[type]}   url [description]
 * @param  {Function} cb  [description]
 * @return {[type]}       [description]
 */
function loadHttpUrl(url, cb) {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = function(e) {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				cb(xhr.responseText);
			} else {
				console.error(xhr.statusText);
			}
		}
	};
	xhr.onerror = function(e) {
		console.error(xhr.statusText);
	};
	xhr.send(null);
}

// extract a domain from url
function urlDomain(data) {
	let el = document.createElement('a');
	el.href = data;
	return [el.hostname, el.pathname + el.search + el.hash];
}

function notFound(address, e) {
	console.log('err: ' + address, e);
	return { redirectUrl: PAGE_404 + '?fallback=' + address };
}

function err(msg) {
	console.warn(msg);
}
