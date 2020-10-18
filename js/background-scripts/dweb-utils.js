/**
 * Backgroud functions related to Dweb infrastructure:
 * IPFS, ENS, Swarm etc.
 */

// every visit to UPDATESETTINGSUPDATETHRESHOLD dwebsites the extension 
// updates settings from remote ipfs soure
// see also 'settingsUrl' variable in background.js
const UPDATESETTINGSUPDATETHRESHOLD = 10;


/**
 * RDNtoDS: redirected Decentralized Name to Decentralized storage
 * @param {string} domain [decentralized name URL]
 * @param {string} path   [path in the decentralized name]
 */
async function RDNtoDS(domain, path) {

	let TLD = domain.split('.').pop();

	switch (TLD) {
		case "eth":
			try { 
				var address = await WEB3ENS.getContenthash(domain)

				if (address !== "0x")
					var redirect = await handleENSContenthash(address, domain, path);
				else 
					var redirect = await getSkynet(domain, path);
			} catch(e) {
				var redirect = notFound(domain, e);
			}
			break;
		case "teth":
		case "testeth":
			// if testnet is diabled, return nothing
			if (!enableEteherumTestnet)
				return {redirectUrl: "about:blank"};

			// We transfer from the extension .teth and .testeth TLDs, to.eth and .test TLDs correspondingly
			switch (TLD) {
				case "teth":
					domain = domain.replace(".teth", ".eth");
					break;
				case "testeth":
					domain = domain.replace(".testeth", ".test");
			}

			try {
				var address = await WEB3ENS.getContenthashTestnet(domain);

				if (address !== "0x")
					var redirect = await handleENSContenthash(address, domain, path);
				else 
					var redirect = notFound(domain, e);
			} catch(e) {
				var redirect = notFound(domain, e);
			}
	}

	return redirect;
}

function handleENSContenthash(address, ensDomain, ensPath) {
	return redirectENStoIPFS(address.slice(14), ensDomain, ensPath);
}

// create IPFS link and redicrect to it
function redirectENStoIPFS(hex, ensDomain, ensPath) {
	let ipfsHash = hextoIPFS(hex);
	let ipfsAddress = ipfsGateways.currentGateway.address + '/ipfs/' + ipfsHash + ensPath;

	localENS[ipfsHash] = ensDomain;

	// increase counter each visit
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			increaseUsageCounter(item);
			
			return {
					redirectUrl: ipfsAddress
			};
		},
		err
	);
}

// retrieve general ENS content field
async function getSkynet(ensDomain, ensPath) {
	try {
		var  content = await WEB3ENS.getSkynet(ensDomain);
		if (content == "") 
			var redirect = notFound(ensDomain,e);

		var redirect = redirectENStoSkynet(content, ensDomain, ensPath);
	} catch(e) { 
		var redirect = notFound(ensDomain,e);
	}

	return redirect;
}

// create Skynet link and redicrect to it
function redirectENStoSkynet(CID, ensDomain, ensPath) {
	let skynetAddress = skynetGateways.currentGateway.address + '/' + CID + ensPath;

	localENS[skynetAddress] = ensDomain;

	// increase counter each visit
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			increaseUsageCounter(item);

			return {
					redirectUrl: skynetAddress
			};
		},
		err
	);
}

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

function hextoIPFS(hex) {
	let dig = Multihashes.fromHexString(hex);
	let ipfsBuffer = Multihashes.encode(dig, 18, 32);
	let ipfsHash = Multihashes.toB58String(ipfsBuffer);

	return ipfsHash;
}

function increaseUsageCounter(item) {
	if (Object.entries(item).length != 0) {
		// increase counter
		let newCounter = item.usageCounter + 1;
		
		// we check for settings update each UPDATESETTINGSUPDATETHRESHOLD websites visits
		if (newCounter % UPDATESETTINGSUPDATETHRESHOLD == 0)
			checkforUpdates = true;
		
		promisify(browser.storage.local, 'set', [{ usageCounter: newCounter }]);
	} else {
		// init counter
		promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);
	}
}