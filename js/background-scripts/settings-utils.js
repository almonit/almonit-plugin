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
const gateway_options = Object.freeze({
	RANDOM: 'randofm',
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
		let ipfsGateways = new Gateways();

		// let defaultIpfsGateways = {
		ipfsGateways.addDefault('ipfs.io', 'Ipfs', 'https://ipfs.io/');
		ipfsGateways.addDefault('ipfs.eternum.io', 'Eternum', 'https://ipfs.eternum.io');
		ipfsGateways.addDefault('cloudflare-ipfs.com', 'Cloudflare', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('hardbin.com', 'Hardbin', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('gateway.temporal.cloud', 'Temporal', 'https://gateway.temporal.cloud');
		ipfsGateways.addDefault('gateway.pinata.cloud', 'Pinata', 'https://gateway.pinata.cloud');
		ipfsGateways.addDefault('permaweb.io', 'Permaweb', 'https://permaweb.io');
		ipfsGateways.addDefault('ipfs.privacytools.io', 'Privacytools', 'https://ipfs.privacytools.io');

		ipfsGateways.setGatewayOptions("RANDOM");

		let shortcuts = {
			addressbar: 'Ctrl+Shift+T',
			settings: 'Ctrl+Shift+O'
		};

		let settings = {
			metricsPermission: 'uninitialized',
			autoGatewaysUpdate: true,
			ethereum: 'infura',
			ipfsGateways: ipfsGateways,
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
		let ipfsGateways = new Gateways();

		// let defaultIpfsGateways = {
		ipfsGateways.addDefault('ipfs.io', 'Ipfs', 'https://ipfs.io');
		ipfsGateways.addDefault('ipfs.eternum.io', 'Eternum', 'https://ipfs.eternum.io');
		ipfsGateways.addDefault('cloudflare-ipfs.com', 'Cloudflare', 'https://cloudflare-ipfs.com');
		ipfsGateways.addDefault('hardbin.com', 'Hardbin', 'https://hardbin.com');
		ipfsGateways.addDefault('gateway.temporal.cloud', 'Temporal', 'https://gateway.temporal.cloud');
		ipfsGateways.addDefault('gateway.pinata.cloud', 'Pinata', 'https://gateway.pinata.cloud');
		ipfsGateways.addDefault('permaweb.io', 'Permaweb', 'https://permaweb.io');
		ipfsGateways.addDefault('ipfs.privacytools.io', 'Privacytools', 'https://ipfs.privacytools.io');

		ipfsGateways.setGatewayOptions("RANDOM");

		let OldSettings = storage.settings;

		let settings = {
			metricsPermission: OldSettings.metricsPermission,
			autoGatewaysUpdate: OldSettings.autoGatewaysUpdate,
			ethereum: OldSettings.ethereum,
			ipfsGateways: ipfsGateways,
			shortcuts: OldSettings.shortcuts
		};

		promisify(browser.storage.local, 'set', [{ settings }]);

		//reload session after settings update.
		loadSettingsSetSession(storage);
	}
}

/**
 * [Load settings]
 * @param  {json} storage [current settings in browser storage]
 */
function loadSettingsSetSession(storage) {
	let settings = storage.settings;

	if (!settings || ('ipfs_gateway' in settings) ) {
		loadSettings();
		return;
	}
	// load settings
	ethereum = settings.ethereum;
	ethereumNode = setEthereumNode(ethereum);

	metricsPermission = settings.metricsPermission;
	autoGatewaysUpdate = settings.autoGatewaysUpdate;

	WEB3ENS.connect_web3(ethereumNode);

	// set current gateway for this session and update settings storage
	settings.ipfsGateways = new Gateways(settings.ipfsGateways); //turn data into Gateways object
	settings.ipfsGateways.setCurrentGateway();
	promisify(browser.storage.local, 'set', [{ settings }]);
	ipfsGateways = settings.ipfsGateways;
}
