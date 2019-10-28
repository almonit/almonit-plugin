/**
 * Backgroud functions related to settings
 */
const ipfs_options = Object.freeze({
	RANDOM: 'random',
	FORCE: 'force_gateway',
	OTHER: 'other_gateway'
});

function loadSettings() {
	// load plugin settings
	promisify(browser.storage.local, 'get', ['settings']).then(
		loadSettingsSetSession,
		err
	);
}

function err(msg) {
	console.warn(msg);
}

loadSettings();

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
			Wahlers: 'ipfs.wa.hle.rs',
			Cloudflare: 'cloudflare-ipfs.com',
			Temporal: 'gateway.temporal.cloud',
			Pinata: 'gateway.pinata.cloud',
			Serph: 'gateway.serph.network',
			Permaweb: 'permaweb.io'
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
		console.info('settings are preparing...');
		loadSettings();
		return;
	}
	// load settings
	const ethereum = storage.settings.ethereum;
	const ethereumNode = setEthereumNode(ethereum);

	const metricsPermission = storage.settings.metricsPermission;

	WEB3ENS.connect_web3(ethereumNode);

	// set ipfs gateway
	if (storage.settings.ipfs == ipfs_options.RANDOM) {
		if (!ipfsGateway) {
			var keys = Object.keys(storage.settings.gateways);
			var ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];

			ipfsGateway = {
				key: ipfsGatewayKey,
				value: 'https://' + storage.settings.gateways[ipfsGatewayKey]
			};
		}
	} else if (storage.settings.ipfs == ipfs_options.FORCE) {
		ipfsGateway = JSON.parse(storage.settings.ipfs_gateway);

		ipfsGateway = {
			key: ipfsGateway.key,
			value: 'https://' + ipfsGateway.value
		};
	} else if (storage.settings.ipfs == ipfs_options.OTHER) {
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
