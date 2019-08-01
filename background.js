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

function loadSettings() {
	// load plugin settings
	promisify(browser.storage.local, 'get', ['settings']).then(
		loadSettingsSetSession,
		err
	);
}

loadSettings();

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

function handleENSContenthash(address, ensDomain, ensPath) {
	return redirectENStoIPFS(address.slice(14), ensDomain, ensPath);
}

// retrieve general ENS content field
function getENSContent(ensDomain, ensPath) {
	return WEB3ENS.getContent(ensDomain).then(function(content) {
		return handleENSContent(content, ensDomain, ensPath);
	}, notFound.bind(null, ensDomain));
}

function handleENSContent(hex, ensDomain, ensPath) {
	if (hex.slice(0, 2) == '0x')
		return redirectENStoIPFS(hex.slice(2), ensDomain, ensPath);
	else return err('ENS content exist but does not point to an IPFS address');
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

browser.runtime.onInstalled.addListener(initSettings);
/**
 * [Initiate plugin settings when first installed]
 * @param  {[string]} details [reason that function was called]

 */
function initSettings(details) {
	if (details.reason == 'install') {
		let gateways = {
			Ipfs: 'ipfs.io',
			Siderus: 'siderus.io',
			Eternum: 'ipfs.eternum.io',
			Infura: 'ipfs.infura.io',
			Hardbin: 'hardbin.com',
			Wahlers: 'ipfs.wa.hle.rs',
			Cloudflare: 'cloudflare-ipfs.com',
			Temporal: 'gateway.temporal.cloud',
			serph: 'gateway.serph.network'
		};

		let shortcuts = {
			addressbar: 'Ctrl+Shift+T',
			settings: 'Ctrl+Shift+O'
		};

		let settings = {
			metricsPermission: 'uninitialized',
			ethereum: 'infura',
			gateways: gateways,
			ipfs: 'random',
			ipfs_gateway: '',
			ipfs_other_gateway: '',
			shortcuts: shortcuts
		};

		promisify(browser.storage.local, 'set', [{ settings }]);
		// save empty metrics
		let savedMetrics = {};
		promisify(browser.storage.local, 'set', [{ savedMetrics }]);
		setTimeout(() => {
			browser.tabs.create({ url: 'https://almonit.eth' });
		}, 1000);
	}
}

/**
 * [Load settings]
 * @param  {json} storage [current settings in browser storage]
 */
function loadSettingsSetSession(storage) {
	if (!storage.settings) {
		console.info('settings is preparing...');
		loadSettings();
		return;
	}
	// load settings
	ethereum = storage.settings.ethereum;
	ethereumNode = setEthereumNode(ethereum);

	metricsPermission = storage.settings.metricsPermission;

	WEB3ENS.connect_web3(ethereumNode);

	// set ipfs gateway
	if (storage.settings.ipfs == 'random') {
		if (!ipfsGateway) {
			var keys = Object.keys(storage.settings.gateways);
			var ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];
			var session = {
				ipfsGateway: {
					key: ipfsGatewayKey,
					value: storage.settings.gateways[ipfsGatewayKey]
				}
			};

			ipfsGateway = {
				key: ipfsGatewayKey,
				value: 'https://' + storage.settings.gateways[ipfsGatewayKey]
			};
		}
	} else if (storage.settings.ipfs == 'force_gateway') {
		ipfsGateway = JSON.parse(storage.settings.ipfs_gateway);
		var session = {
			ipfsGateway: ipfsGateway
		};

		ipfsGateway = {
			key: ipfsGateway.key,
			value: 'https://' + ipfsGateway.value + '/'
		};
	} else if (storage.settings.ipfs == 'other_gateway') {
		ipfsGateway = {
			key: 'other',
			value: storage.settings.ipfs_other_gateway
		};
	}

	// save session info
	var session = {
		ipfsGateway: ipfsGateway
	};
	promisify(browser.storage.local, 'set', [{ session }]);
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

function hextoIPFS(hex) {
	var dig = Multihashes.fromHexString(hex);
	var ipfsBuffer = Multihashes.encode(dig, 18, 32);
	var ipfsHash = Multihashes.toB58String(ipfsBuffer);

	return ipfsHash;
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
