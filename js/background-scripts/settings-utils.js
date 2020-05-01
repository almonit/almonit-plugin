/**
 * Global variables
 */
var ethereum;
var metricsPermission;
var autoGatewaysUpdate;

/**
 * Backgroud functions related to settings
 */
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
		//gatewaysDataJSON is defined in resources/gateways.json
		let gatewaysData = JSON.parse(gatewaysDataJSON);

		// ethereum
		let ethereumGateways = new Gateways();
		ethereumGateways.setDefaultGateways(gatewaysData.ethereumGateways);
		ethereumGateways.setGatewayOptions("RANDOM");

		// ethereumGateways.addDefault('mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17', 'Infura', 'https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17');

		// ipfs
		let ipfsGateways = new Gateways();
		ipfsGateways.setDefaultGateways(gatewaysData.ipfsGateways);
		ipfsGateways.setGatewayOptions("RANDOM");

		// skynet
		let skynetGateways = new Gateways();
		skynetGateways.setDefaultGateways(gatewaysData.skynetGateways);
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
	//gatewaysDataJSON is defined in resources/gateways.json
	let gatewaysData = JSON.parse(gatewaysDataJSON);

	// for version < 0.0.9, remove after version 0.0.13
	// remvoe also from function loadSettingsSetSession
	if ('ipfs_gateway' in storage.settings) {

		// ethereum
		var ethereumGateways = new Gateways();
		ethereumGateways.setDefaultGateways(gatewaysData.ethereumGateways);
		ethereumGateways.setGatewayOptions("RANDOM");

		// ipfs
		var ipfsGateways = new Gateways();
		ipfsGateways.setDefaultGateways(gatewaysData.ipfsGateways);

		// transfer custom gateways
		for (key in settings.ipfsGateways.added)
			ipfsGateways.addCustom(key, settings.ipfsGateways.added[key], "https://" + key);

		// transfer removed gateways
		for (key in settings.ipfsGateways.removed)
			ipfsGateways.removeGateway(key);			

		switch (settings.ipfs) {
			case "random": 
				ipfsGateways.setGatewayOptions("RANDOM");
				break;
			case "force_gateway":
				ipfsGateways.setGatewayOptions("FORCE");
				ipfsGateways.setGatewayOptions("FORCE", settings.ipfs_gateway.key);
				// set current gateway to the forced one
				break;
			case "other_gateway":
				ipfsGateways.setGatewayOptions("OTHER");
				ipfsGateways.setGatewayOptions("OTHER",settings.ipfs_other_gateway);
				// set current gateway to other
		}

		// skynet
		var skynetGateways = new Gateways();
		skynetGateways.setDefaultGateways(gatewaysData.skynetGateways);
		skynetGateways.setGatewayOptions("RANDOM");
		

		var OldSettings = storage.settings;

		var settings = {
			metricsPermission: OldSettings.metricsPermission,
			autoGatewaysUpdate: OldSettings.autoGatewaysUpdate,
			ethereumGateways: ethereumGateways,
			ipfsGateways: ipfsGateways,
			skynetGateways: skynetGateways,
			shortcuts: OldSettings.shortcuts
		};

	} else { // just update gateway lists
		var settings = item.settings;

		settings.ethereumGateways = new Gateways(settings.ethereumGateways);
		settings.ipfsGateways = new Gateways(settings.ipfsGateways);
		settings.skynetGateways = new Gateways(settings.skynetGateways);

		settings.ethereumGateways.setDefaultGateways(gatewaysData.ethereumGateways);
		settings.ipfsGateways.setDefaultGateways(gatewaysData.ipfsGateways);
		settings.skynetGateways.setDefaultGateways(gatewaysData53.skynetGateways);

	}

	//reload session after settings update.
	promisify(browser.storage.local, 'set', [{ settings }]);
	loadSettingsSetSession(storage);
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

	// catch webRequests to correct broken gateways
	// we catch only 'default' gateways as there's permission only for these in manifest.json
	var ipfsGatewaystoCatch = [];
	var skynetGatewaystoCatch = [];

	for (gw in ipfsGateways.default) {
		ipfsGatewaystoCatch.push(ipfsGateways.default[gw].address + '/ipfs*')
	}

	for (gw in skynetGateways.default) {
		skynetGatewaystoCatch.push(skynetGateways.default[gw].address + '/*')
	}

	browser.webRequest.onHeadersReceived.addListener(
		(e) => handleHeaderReceived(e, skynetGateways, 'skynetGateways'),
		{ urls: skynetGatewaystoCatch, types: ['main_frame'] },
		['blocking', 'responseHeaders']
	);

	browser.webRequest.onHeadersReceived.addListener(
		(e) => handleHeaderReceived(e, ipfsGateways, 'ipfsGateways'),
		{ urls: ipfsGatewaystoCatch, types: ['main_frame'] },
		['blocking', 'responseHeaders']
	);

}
