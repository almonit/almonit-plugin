/**
 * Backgroud functions related to Dweb infrastructure:
 * IPFS, ENS, Swarm etc.
 */

function handleENSContenthash(address, ensDomain, ensPath) {
	return redirectENStoIPFS(address.slice(14), ensDomain, ensPath);
}

// retrieve general ENS content field
function getENSContent(ensDomain, ensPath) {
	return WEB3ENS.getContent(ensDomain).then(function(content) {
		return handleENSContent(content, ensDomain, ensPath);
	}, notFound.bind(null, ensDomain));
}

function handleENSContent(hex, ensDomain, ensPath) {
	if (hex.slice(0, 2) == "0x")
		return redirectENStoIPFS(hex.slice(2), ensDomain, ensPath);
	else return err("ENS content exist but does not point to an IPFS address");
}

function hextoIPFS(hex) {
	let dig = Multihashes.fromHexString(hex);
	let ipfsBuffer = Multihashes.encode(dig, 18, 32);
	let ipfsHash = Multihashes.toB58String(ipfsBuffer);

	return ipfsHash;
}
