/**
 * Global variables
 */
var ethereum;
var metricsPermission;
var autoGatewaysUpdate;

/**
 * Backgroud functions related to settings
 */
const gateway_options = Object.freeze({
	RANDOM: 'randofm',
	FORCE: 'force_gateway',
	OTHER: 'other_gateway'
});

function loadSettings(updateGateway = true) {
	// load plugin settings
	promisify(browser.storage.local, 'get', ['settings']).then(
		res => loadSettingsSetSession(res,updateGateway),
		err
	);
}

function err(msg) {
	console.warn(msg);
}

loadSettings();

browser.runtime.onInstalled.addListener(onNewVersion);


function onNewVersion(details) {
	switch (details.reason) {
		case 'install':
			initSettings();
		break;
		case 'update':
			promisify(browser.storage.local, 'get', ['settings']).then(
				updateSettings,
				err
			);
1	}
}

/**
 * [Initiate plugin settings when first installed]
 * @param  {[string]} details [reason that function was called]

 */
function initSettings() {

		// ethereum
		let ethereumGateways = new Gateways();

		ethereumGateways.addDefault('mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17', 'Infura', 'https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17');
		ethereumGateways.addDefault('cloudflare-eth.com', 'Cloudflare', 'https://cloudflare-eth.com');

		ethereumGateways.setGatewayOptions("RANDOM");

		// ipfs
		let ipfsGateways = new Gateways();

		ipfsGateways.addDefault('ipfs.io', 'Ipfs', 'https://ipfs.io/');
		ipfsGateways.addDefault('ipfs.eternum.io', 'Eternum', 'https://ipfs.eternum.io');
		ipfsGateways.addDefault('cloudflare-ipfs.com', 'Cloudflare', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('hardbin.com', 'Hardbin', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('gateway.temporal.cloud', 'Temporal', 'https://gateway.temporal.cloud');
		ipfsGateways.addDefault('gateway.pinata.cloud', 'Pinata', 'https://gateway.pinata.cloud');

		ipfsGateways.setGatewayOptions("RANDOM");

		// skynet
		let skynetGateways = new Gateways();

		skynetGateways.addDefault('siasky.net', 'Siasky', 'https://siasky.net');
		skynetGateways.addDefault('skydrain.net', 'Skydrain', 'https://skydrain.net');
		skynetGateways.addDefault('sialoop.net', 'Sialoop', 'https://sialoop.net');
		skynetGateways.addDefault('siacdn.com', 'Siacdn', 'https://siacdn.com');
		skynetGateways.addDefault('skynethub.io', 'Skynethub', 'https://skynethub.io');
		skynetGateways.addDefault('skynet.tutemwesi.com', 'Tutemwesi', 'https://skynet.tutemwesi.com');
		skynetGateways.addDefault('vault.lightspeedhosting.com', 'Lightspeed Hosting', 'https://vault.lightspeedhosting.com');
		

		skynetGateways.setGatewayOptions("RANDOM");

		let shortcuts = {
			addressbar: 'Ctrl+Shift+T',
			settings: 'Ctrl+Shift+O'
		};

		let settings = {
			metricsPermission: 'uninitialized',
			autoGatewaysUpdate: true,
			ethereumGateways: ethereumGateways,
			ipfsGateways: ipfsGateways,
			skynetGateways: skynetGateways,
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
/**
 * [Update settings when extension version is updated]
 * @param  {[type]}
 * @return {[type]}
 */
function updateSettings(storage) {
	// for version < 0.0.9, remove after version 0.0.13
	// remvoe also from function loadSettingsSetSession
	if ('ipfs_gateway' in storage.settings) {

		// ethereum
		let ethereumGateways = new Gateways();

		ethereumGateways.addDefault('mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17', 'Infura', 'https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17');
		ethereumGateways.addDefault('cloudflare-eth.com', 'Cloudflare', 'https://cloudflare-eth.com');

		ethereumGateways.setGatewayOptions("RANDOM");

		// ipfs
		let ipfsGateways = new Gateways();

		ipfsGateways.addDefault('ipfs.io', 'Ipfs', 'https://ipfs.io/');
		ipfsGateways.addDefault('ipfs.eternum.io', 'Eternum', 'https://ipfs.eternum.io');
		ipfsGateways.addDefault('cloudflare-ipfs.com', 'Cloudflare', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('hardbin.com', 'Hardbin', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('gateway.temporal.cloud', 'Temporal', 'https://gateway.temporal.cloud');
		ipfsGateways.addDefault('gateway.pinata.cloud', 'Pinata', 'https://gateway.pinata.cloud');

		ipfsGateways.setGatewayOptions("RANDOM");

		// skynet
		let skynetGateways = new Gateways();

		skynetGateways.addDefault('siasky.net', 'Siasky', 'https://siasky.net');
		skynetGateways.addDefault('skydrain.net', 'Skydrain', 'https://skydrain.net');
		skynetGateways.addDefault('sialoop.net', 'Sialoop', 'https://sialoop.net');
		skynetGateways.addDefault('siacdn.com', 'Siacdn', 'https://siacdn.com');
		skynetGateways.addDefault('skynethub.io', 'Skynethub', 'https://skynethub.io');
		skynetGateways.addDefault('skynet.tutemwesi.com', 'Tutemwesi', 'https://skynet.tutemwesi.com');
		skynetGateways.addDefault('vault.lightspeedhosting.com', 'Lightspeed Hosting', 'https://vault.lightspeedhosting.com');
		

		skynetGateways.setGatewayOptions("RANDOM");

		let OldSettings = storage.settings;

		let settings = {
			metricsPermission: OldSettings.metricsPermission,
			autoGatewaysUpdate: OldSettings.autoGatewaysUpdate,
			ethereumGateways: ethereumGateways,
			ipfsGateways: ipfsGateways,
			skynetGateways: skynetGateways,
			shortcuts: OldSettings.shortcuts
		};

		promisify(browser.storage.local, 'set', [{ settings }]);
haha,
		//reload session after settings update.
		loadSettingsSetSession(storage);
	}
}

/**
 * [Load settings]
 * @param  {json} storage [current settings in browser storage]
 */
function loadSettingsSetSession(storage, updateGateway = true) {
	let settings = storage.settings;

	if (!settings || ('ipfs_gateway' in settings) ) {
		loadSettings();
		return;
	}

	metricsPermission = settings.metricsPermission;
	autoGatewaysUpdate = settings.autoGatewaysUpdate;

	//turn data into Gateways object 
	settings.ethereumGateways = new Gateways(settings.ethereumGateways); 
	settings.ipfsGateways = new Gateways(settings.ipfsGateways);
	settings.skynetGateways = new Gateways(settings.skynetGateways);
	
	if (updateGateway) {
		settings.ethereumGateways.setCurrentGateway();
		settings.ipfsGateways.setCurrentGateway();
		settings.skynetGateways.setCurrentGateway();
	}


	promisify(browser.storage.local, 'set', [{ settings }]);

	ethereumGateways = settings.ethereumGateways;
	ipfsGateways = settings.ipfsGateways;
	skynetGateways = settings.skynetGateways;

	WEB3ENS.connect_web3(ethereumGateways.currentGateway.address);
}
