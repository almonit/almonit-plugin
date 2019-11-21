/**
 * settings
 */
var localENS = {}; // a local ENS of all names we discovered
var ensDomain = ''; // domain in current call
var ipfsGateway = false;
let redirectAddress = null;

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

browser.webRequest.onHeadersReceived.addListener(
	checkGateway,
	{ urls: ['http://*/*ipfs*', 'https://*/*ipfs*'], types: ['main_frame'] },
	["blocking", "responseHeaders"]
);

browser.webRequest.onBeforeSendHeaders.addListener(
  checkGatewayBeforeSendHeaders,
  { urls: ['http://*/*ipfs*', 'https://*/*ipfs*']},
  ["blocking", "requestHeaders"]
);

browser.webRequest.onSendHeaders.addListener(
	checkGatewaySendHeaders,
	{ urls: ['http://*/*ipfs*', 'https://*/*ipfs*'], types: ['main_frame'] },
	["requestHeaders"]
);

browser.webRequest.onErrorOccurred.addListener(
  logError,
  { urls: ['http://*/*ipfs*', 'https://*/*ipfs*'], types: ['main_frame'] }
);

function checkGatewayBeforeSendHeaders(e) {
	console.log("Before send header: ", e.requestHeaders);
	// return {responseHeaders: e};
}

function checkGatewaySendHeaders(e) {
	console.log("send header: ", e.requestHeaders);
}

function checkGateway(e) {
	console.log("responseHeaders received: ", e);
	return {responseHeaders: e.responseHeaders};
}

function logError(responseDetails) {
  console.log("error url: ", responseDetails.url);
  console.log("error details: ", responseDetails.error);
}

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
	var ipfsAddress = ipfsGateway.value + '/ipfs/' + ipfsHash + ensPath;

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
