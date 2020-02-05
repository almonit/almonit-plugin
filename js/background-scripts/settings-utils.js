/**
 * Global variables
 */
var ethereum;
var ethereumNode;
var metricsPermission;
var autoGatewaysUpdate;

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
			'ipfs.io': 'Ipfs',
			'ipfs.eternum.io': 'Eternum',
			'cloudflare-ipfs.com': 'Cloudflare',
			'hardbin.com': 'Hardbin',
			'gateway.temporal.cloud': 'Temporal',
			'gateway.pinata.cloud': 'Pinata',
			'permaweb.io': 'Permaweb',
			'ipfs.privacytools.io': 'Privacytools'
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
			autoGatewaysUpdate: true,
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

	metricsPermission  = storage.settings.metricsPermission;
	autoGatewaysUpdate = storage.settings.autoGatewaysUpdate;

	WEB3ENS.connect_web3(ethereumNode);

	var ipfsGatewaysSettings = storage.settings.ipfsGateways;
  var ipfsGatewaysList = 
  			calcualteGatewayList(ipfsGatewaysSettings.default, ipfsGatewaysSettings.removed, ipfsGatewaysSettings.added);

  
	// set ipfs gateway
	if (storage.settings.ipfs == ipfs_options.RANDOM) {
		if (!ipfsGateway) {
			var keys = Object.keys(ipfsGatewaysList);
			var ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];

			ipfsGateway = {
				key: ipfsGatewayKey,
				name: ipfsGatewaysList[ipfsGatewayKey],
				address: 'https://' + ipfsGatewayKey
			};
		}
	} else if (storage.settings.ipfs == ipfs_options.FORCE) {
		ipfsGateway = JSON.parse(storage.settings.ipfs_gateway);

		ipfsGateway = {
			key: ipfsGateway.key,
			name: ipfsGateway.name,
			address: 'https://' + ipfsGateway.key
		};
	} else if (storage.settings.ipfs == ipfs_options.OTHER) {
		ipfsGateway = {
			key: 'other',
			name: 'other',
			address: storage.settings.ipfs_other_gateway
		};
	}

	// save session info
	var session = {
		ipfsGateway: ipfsGateway
	};
	promisify(browser.storage.local, 'set', [{ session }]);
}

/**
 * [Calculates a gateway list out of three given lists]
 * @param  {[Object]} defaultGateways [list of default software gateways]
 * @param  {[Object]} removedGateways [list of gateways the user manually added]
 * @param  {[Object]} addedGateways   [list of gateways the user manually removed]
 * @return {[Object]}                 [list of gateways the software can use]
 */
function calcualteGatewayList(defaultGateways, removedGateways, addedGateways) {
  
  // begin with default gateways
  var ipfsGatewaysList = {};
  for (var gate in defaultGateways) {
			ipfsGatewaysList[gate] = defaultGateways[gate];
    }

  // delete removed gateways
  for (var gate in removedGateways) {
      delete ipfsGatewaysList[gate];
  }

  // add "added gateways"
  for (var gate in addedGateways) {
      ipfsGatewaysList[gate] = addedGateways[gate];
  }

  return ipfsGatewaysList;

}