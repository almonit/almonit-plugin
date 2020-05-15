/**
 * Backgroud functions related to Dweb infrastructure:
 * IPFS, ENS, Swarm etc.
 */

function handleENSContenthash(address, ensDomain, ensPath) {
	return redirectENStoIPFS(address.slice(14), ensDomain, ensPath);
}

// extract ipfs address from hex and redirects there
// before redirecting, handling usage metrics
function redirectENStoIPFS(hex, ensDomain, ensPath) {
	let ipfsHash = hextoIPFS(hex);
	let ipfsAddress = ipfsGateways.currentGateway.address + '/ipfs/' + ipfsHash + ensPath;

	localENS[ipfsHash] = ensDomain;

	// update metrics and redirect to ipfs
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			if (Object.entries(item).length != 0) {
				// increate counter
				promisify(browser.storage.local, 'set', [
					{
						usageCounter: item.usageCounter + 1
					}
				]);

				// update metrics (if permissioned)
				if (metricsPermission) metrics.add(ensDomain);
				return {
					redirectUrl: ipfsAddress
				};
			} else {
				// init counter
				promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);

				// forward to "subscribe to metrics page" upon first usage
				// save variables to storage to allow subscription page redirect to the right ENS+IPFS page
				promisify(browser.storage.local, 'set', [
					{ ENSRedirectUrl: ipfsAddress }
				]);
				return {
					redirectUrl: browser.extension.getURL(
						'pages/privacy_metrics_subscription.html'
					)
				};
			}
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

function redirectENStoSkynet(CID, ensDomain, ensPath) {
	let skynetAddress = skynetGateways.currentGateway.address + '/' + CID + ensPath;

	localENS[skynetAddress] = ensDomain;

	// update metrics and redirect to ipfs
	return promisify(browser.storage.local, 'get', ['usageCounter']).then(
		function(item) {
			if (Object.entries(item).length != 0) {
				// increate counter
				promisify(browser.storage.local, 'set', [
					{
						usageCounter: item.usageCounter + 1
					}
				]);

				// update metrics (if permissioned)
				if (metricsPermission) metrics.add(ensDomain);
				return {
					redirectUrl: skynetAddress
				};
			} else {
				// init counter
				promisify(browser.storage.local, 'set', [{ usageCounter: 1 }]);

				// forward to "subscribe to metrics page" upon first usage
				// save variables to storage to allow subscription page redirect to the right ENS+IPFS page
				promisify(browser.storage.local, 'set', [
					{ ENSRedirectUrl: skynetAddress }
				]);
				return {
					redirectUrl: browser.extension.getURL(
						'pages/privacy_metrics_subscription.html'
					)
				};
			}
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
