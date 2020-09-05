/**
 * Backgroud functions related to Dweb infrastructure:
 * IPFS, ENS, Swarm etc.
 */

function handleENSContenthash(address, ensDomain, ensPath) {
	return redirectENStoIPFS(address.slice(14), ensDomain, ensPath);
}

// create IPFS link and redicrect to it
function redirectENStoIPFS(hex, ensDomain, ensPath) {
	let ipfsHash = hextoIPFS(hex);
	let ipfsAddress = ipfsGateways.currentGateway.address + '/ipfs/' + ipfsHash + ensPath;

	localENS[ipfsHash] = ensDomain;

	// increase counter
	// Note: counter is not used at the moment, it's counted (locally) for future features
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			if (Object.entries(item).length != 0) {
				// increate counter
				promisify(browser.storage.local, 'set', [{ usageCounter: item.usageCounter + 1 }]);
			} else {
				// init counter
				promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);
			}

			return {
					redirectUrl: ipfsAddress
			};
		},
		err
	);
}

// retrieve general ENS content field
function getSkynet(ensDomain, ensPath) {
	return WEB3ENS.getSkynet(ensDomain).then(function(content) {
		if (content == "") 
			return;

		return redirectENStoSkynet(content, ensDomain, ensPath);
	}, notFound.bind(null, ensDomain));
}

// create Skynet link and redicrect to it
function redirectENStoSkynet(CID, ensDomain, ensPath) {
	let skynetAddress = skynetGateways.currentGateway.address + '/' + CID + ensPath;

	localENS[skynetAddress] = ensDomain;

	// increate counter
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			if (Object.entries(item).length != 0) {
				// increate counter
				promisify(browser.storage.local, 'set', [{ usageCounter: item.usageCounter + 1 }]);
			} else {
				// init counter
				promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);
			}

			return {
					redirectUrl: ipfsAddress
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
