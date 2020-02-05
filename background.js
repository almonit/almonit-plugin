/**
 * settings
 */
var localENS = {}; // a local ENS of all names we discovered
var ensDomain = ''; // domain in current call
var ipfsGateway = false;
let redirectAddress = null;
var ipfsGateways = {};
var checkedforUpdates = false;
var settingsUrl = "settings.extension.almonit.eth";

const PAGE_404 = browser.runtime.getURL('pages/error.html');
const PAGE_REDIRECT = browser.runtime.getURL('pages/redirect.html');
const PAGE_SETTINGS = browser.runtime.getURL('pages/settings.html');

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
				return handleENSContenthash(address, ensDomain, ensPath);
			},
			function(error) {
				return getENSContent(ensDomain, ensPath);
			}
		)
		.catch(notFound.bind(null, ensDomain));
}

// extract ipfs address from hex and redirects there
// before redirecting, handling usage metrics
function redirectENStoIPFS(hex, ensDomain, ensPath) {
	var ipfsHash = hextoIPFS(hex);
	var ipfsAddress = ipfsGateway.address + '/ipfs/' + ipfsHash + ensPath;

	localENS[ipfsHash] = ensDomain;

	// update metrics and redirect to ipfs
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			if (Object.entries(item).length != 0) {
				// increate counter
				promisify(browser.storage.local, 'set', [
					{
						usageCounter: item.usageCounter + 1
					}
				]);

				// update metrics (if permissioned)
				if (metricsPermission) metrics.add(ensDomain);
				return {
					redirectUrl: ipfsAddress
				};
			} else {
				// init counter
				promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);

				// forward to "subscribe to metrics page" upon first usage
				// save variables to storage to allow subscription page redirect to the right ENS+IPFS page
				promisify(browser.storage.local, 'set', [
					{ ENSRedirectUrl: ipfsAddress }
				]);
				return {
					redirectUrl: browser.extension.getURL(
						'pages/privacy_metrics_subscription.html'
					)
				};
			}
		},
		err
	);
}

/**
 * Anonymous default settings update (ipfs gateways list etc)
 */
browser.webRequest.onCompleted.addListener(
  handleRequestComplete,
  { urls: ['http://*/*ipfs*/*', 'https://*/*ipfs*/*'], types: ['main_frame'] }
);

function handleRequestComplete(e) {
	let statusDigit = (''+e.statusCode)[0];
	if (!checkedforUpdates && (statusDigit == 2) && autoGatewaysUpdate)  {
		let [domain, path] = urlDomain(e.url);

		checkedforUpdates = true;
		initSettingsUpgrade(domain);
	}

	return {responseHeaders: e.responseHeaders};
}

function initSettingsUpgrade(domain) {
	WEB3ENS.getContenthash(settingsUrl)
	.then(
		function(address) {
			let hex = address.slice(14);
			let ipfsHash = hextoIPFS(hex);
			let ipfsAddress = "https://" + domain + '/ipfs/' + ipfsHash;
			loadHttpUrl(ipfsAddress, settingsUpgrade);
		},
		function(error) {
			err(error);
	});
}

function settingsUpgrade(newSettings) {
	
	try {
		newSettings = JSON.parse(newSettings);
  } catch (e) {
  	return false;
  }

  ipfsGateways.default = newSettings;
	promisify(browser.storage.local, 'get', ['settings']).then(function(item) {
		var settings = item.settings;
		settings.ipfsGateways.default = newSettings;
		promisify(browser.storage.local, 'set', [{ settings }]);
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
	let currentGateway = normalizeUrl(ipfsGateway.address, {
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
		let currentGateway = normalizeUrl(ipfsGateway.address, {
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
	// this step may change only session options and not user settings
	if (storage.settings.ipfs == ipfs_options.OTHER) {
		ipfsGateway = {
			key: 'other',
			value: storage.settings.ipfs_other_gateway
		};
	} else if (
		storage.settings.ipfs == ipfs_options.RANDOM ||
		storage.settings.ipfs == ipfs_options.FORCE
	) {
		var ipfsGatewaysSettings = storage.settings.ipfsGateways;
  
		var ipfsGatewaysList = 
  			calcualteGatewayList(ipfsGatewaysSettings.default, ipfsGatewaysSettings.removed, ipfsGatewaysSettings.added);

		var ipfsGatewayKey = '';
		var keys = Object.keys(ipfsGatewaysList);

		// if keys.length < 1, don't do anything
		if (keys.length > 1)
			do ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];
			while (ipfsGatewayKey == ipfsGateway.key);

		ipfsGateway = {
			key: ipfsGatewayKey,
			name: ipfsGatewaysList[ipfsGatewayKey],
			address: 'https://' + ipfsGatewayKey
		};
	}

	// save session info
	var session = {
		ipfsGateway: ipfsGateway
	};
	promisify(browser.storage.local, 'set', [{ session }]);

	//redirect

	let [fullPath, _, hash] = separateIpfsUrl(url);
	if (localENS[hash]) {
		var ipfsAddress =
			ipfsGateway.address + fullPath;
		browser.tabs.update(tab, { url: ipfsAddress });
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
			var settings = item.settings;
			settings.metricsPermission = request.permission;
			promisify(browser.storage.local, 'set', [{ settings }]);
		},
		err);
	} else if (!!request.settings) {
		var settingsTab = browser.tabs.create({
			url: PAGE_SETTINGS
		});
	} else if (!!request.reloadSettings) {
		loadSettings();
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
function setEthereumNode(eth) {
	switch (eth) {
		case 'infura':
			var ethNode =
				'https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17';
			break;
		case 'local':
			var ethNode = 'http://localhost:8545';
			break;
		default:
			var ethNode = eth;
	}
	return ethNode;
}

/**
 * [separateIpfsUrl separates ipfs path from url
 * @param  {[type]} url [description]
 * @return {[type]}      [description]
 */
function separateIpfsUrl(url) {
	var regx = /(\/ipfs\/)(\b\w{46}\b)(?:\/|)([\w\-\.]+[^#?\s]+|)(\?[\w\-\.]+[^#?\s]+|)(\#.+|)/gi;
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
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function (e) {
	 if (xhr.readyState === 4) {
	   if (xhr.status === 200) {
	     cb(xhr.responseText);
	   } else {
	     console.error(xhr.statusText);
	   }
	 }
	};
	xhr.onerror = function (e) {
	 console.error(xhr.statusText);
	};
	xhr.send(null);  
}

// extract a domain from url
function urlDomain(data) {
	var el = document.createElement('a');
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
