/**
 * Global variables
 */
var ethereum;
var ethereumNode;
var metricsPermission;

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
		let deafulrsIpfsGateways = {
			Ipfs: 'ipfs.io',
			Eternum: 'ipfs.eternum.io',
			Infura: 'ipfs.infura.io',
			Cloudflare: 'cloudflare-ipfs.com',
			Temporal: 'gateway.temporal.cloud',
			Pinata: 'gateway.pinata.cloud',
			Permaweb: 'permaweb.io'
		};

		let removedIpfsGateways = {};
		let addedIpfsGateways = {};

		let ipfsGateways = {
			default: deafulrsIpfsGateways,
			removed: removedIpfsGateways,
			added: addedIpfsGateways	
		};


		let shortcuts = {
			addressbar: 'Ctrl+Shift+T',
			settings: 'Ctrl+Shift+O'
		};

		let settings = {
			metricsPermission: 'uninitialized',
			ethereum: 'infura',
			ipfsGateways: ipfsGateways,
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
	ethereum = storage.settings.ethereum;
	ethereumNode = setEthereumNode(ethereum);

	metricsPermission = storage.settings.metricsPermission;

	WEB3ENS.connect_web3(ethereumNode);

	ipfsGateways = storage.settings.ipfsGateways;
  ipfsGatewaysList = {...ipfsGateways.default, ...ipfsGateways.added};


  for (var prop in ipfsGateways.removed) {
      delete ipfsGatewaysList[prop];
  }


	// set ipfs gateway
	if (storage.settings.ipfs == ipfs_options.RANDOM) {
		if (!ipfsGateway) {
			var keys = Object.keys(ipfsGatewaysList);
			var ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];

			ipfsGateway = {
				key: ipfsGatewayKey,
				value: 'https://' + ipfsGatewaysList[ipfsGatewayKey]
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
