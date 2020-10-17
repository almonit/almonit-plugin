/**
 * Global variables
 */
var ethereum;
var autoGatewaysUpdate;

var ethereumTestnet;
var ethereumTestnetInfuraNode = "https://rinkeby.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17";

var reloadingEffortsNumber = 0;
const REALOADINGEFFORTMAX = 100;

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
		//gatewaysDataJSON is defined in resources/gateways.js
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

		// Ethereum testnets
		let ethereumTestnets = new Gateways();
		ethereumTestnets.setDefaultGateways(gatewaysData.ethereumTestnets);;
		ethereumTestnets.setGatewayOptions("FORCE", Object.keys(ethereumTestnets.default)[0]);

		let shortcuts = {
			addressbar: 'Ctrl+Shift+T',
			settings: 'Ctrl+Shift+O'
		};

		let settings = {
			autoGatewaysUpdate: true,
			enableEteherumTestnet: false,
			ethereumGateways: ethereumGateways,
			ipfsGateways: ipfsGateways,
			skynetGateways: skynetGateways,
			ethereumTestnets: ethereumTestnets,
			shortcuts: shortcuts,
			version: browser.runtime.getManifest().version
		};

		promisify(browser.storage.local, 'set', [{ settings }]);

		setTimeout(() => { 
				browser.tabs.create({ url: 'pages/welcome_screen.html' });
		}, 1000);
}

/**
 * [Update settings when extension version is updated]
 * @param  {[type]}
 * @return {[type]}
 */
function updateSettings(storage) {
	//gatewaysDataJSON is defined in resources/gateways.js
	let gatewaysData = JSON.parse(gatewaysDataJSON);

	// for version < 0.0.9, remove after version 0.1.5
	// remvoe also from function loadSettingsSetSession
	let oldSettings = storage.settings;

	if (!('skynetGateways' in oldSettings)) {
		// create empty ethereum, ipfs and skynet gateways list
		var ethereumGateways = new Gateways();
		ethereumGateways.setGatewayOptions("RANDOM");

		var ipfsGateways = new Gateways();
		ipfsGateways.setGatewayOptions("RANDOM");

		var skynetGateways = new Gateways();
		skynetGateways.setGatewayOptions("RANDOM");
	
	} else {
		// migrate ethereum, ipfs and skynet gateways list from old settings
		var ethereumGateways = new Gateways(oldSettings.ethereumGateways);
		var ipfsGateways = new Gateways(oldSettings.ipfsGateways);
		var skynetGateways = new Gateways(oldSettings.skynetGateways);		
	}

	// update ethereum, ipfs and skynet default gateways list
	ethereumGateways.setDefaultGateways(gatewaysData.ethereumGateways);	
	ipfsGateways.setDefaultGateways(gatewaysData.ipfsGateways);
	skynetGateways.setDefaultGateways(gatewaysData.skynetGateways);

	// those setting variables were not in old versions of the extension, so we check if they exist
	var autoGatewaysUpdate = ('autoGatewaysUpdate' in oldSettings)? oldSettings.autoGatewaysUpdate : true;
	var enableEteherumTestnet = ('enableEteherumTestnet' in oldSettings)? oldSettings.enableEteherumTestnet : false;
	
	// same goes for ethereumTestnets, but its treatment is longer than one line
	if (!('ethereumTestnets' in oldSettings)) {
		let ethereumTestnets = new Gateways();
		ethereumTestnets.setDefaultGateways(gatewaysData.ethereumTestnets);
		ethereumTestnets.setGatewayOptions("FORCE", Object.keys(ethereumTestnets.default)[0]);
	} else {
		var ethereumTestnets = new Gateways(oldSettings.ethereumTestnets);
		ethereumTestnets.setDefaultGateways(gatewaysData.ethereumTestnets);	
	}

	var settings = {
		autoGatewaysUpdate: oldSettings.autoGatewaysUpdate,
		enableEteherumTestnet: enableEteherumTestnet,
		ethereumGateways: ethereumGateways,
		ipfsGateways: ipfsGateways,
		skynetGateways: skynetGateways,
		ethereumTestnets: ethereumTestnets,
		shortcuts: oldSettings.shortcuts,
		version: browser.runtime.getManifest().version
	};


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

	if ( (!settings || ('version' in settings) || (Object.keys(settings).length === 0) 
		  || (settings.version != browser.runtime.getManifest().version)) 
		  && (reloadingEffortsNumber < REALOADINGEFFORTMAX) ) {
		reloadingEffortsNumber = reloadingEffortsNumber + 1;
		loadSettings();
		return;
	}

	//handle gateways
	settings.ethereumGateways = new Gateways(settings.ethereumGateways); 
	settings.ipfsGateways = new Gateways(settings.ipfsGateways);
	settings.skynetGateways = new Gateways(settings.skynetGateways);
	
	// choose a new gateway if updateGateway flag is set and the gateway option is 'random' 
	if (updateGateway) {
		if (settings.ethereumGateways.option == 'random')
			settings.ethereumGateways.setRandomGateway();
		if (settings.ipfsGateways.option == 'random')
			settings.ipfsGateways.setRandomGateway();
		if (settings.skynetGateways.option == 'random')
			settings.skynetGateways.setRandomGateway();

		promisify(browser.storage.local, 'set', [{ settings }]);
	}

	ethereumGateways = settings.ethereumGateways;
	ipfsGateways = settings.ipfsGateways;
	skynetGateways = settings.skynetGateways;

	// connect to web3
	WEB3ENS.connect_web3(ethereumGateways.currentGateway.address);

	autoGatewaysUpdate = settings.autoGatewaysUpdate;

	// handle Ethereum testnets settings
	enableEteherumTestnet = settings.enableEteherumTestnet;
	ethereumTestnets = new Gateways(settings.ethereumTestnets);
	if (enableEteherumTestnet)
		WEB3ENS.connectWeb3Testnet(ethereumTestnets.currentGateway.address);

	// handle catching webRequests in order to correct broken gateways
	// we catch only 'default' gateways, since there is permission in manifest.json to catch only these
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
