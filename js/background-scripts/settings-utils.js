/**
 * Backgroud functions related to settings
 */

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

			ipfsGateway = {
				key: ipfsGatewayKey,
				value: 'https://' + storage.settings.gateways[ipfsGatewayKey]
			};
		}
	} else if (storage.settings.ipfs == 'force_gateway') {
		ipfsGateway = JSON.parse(storage.settings.ipfs_gateway);

		ipfsGateway = {
			key: ipfsGateway.key,
			value: 'https://' + ipfsGateway.value
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

function loadSettings() {
	// load plugin settings
	promisify(browser.storage.local, 'get', ['settings']).then(
		loadSettingsSetSession,
		err
	);
}