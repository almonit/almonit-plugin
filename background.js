// import web3 files
var imported = document.createElement('script');
imported.src = 'js/multihashes-min.js';
document.getElementsByTagName('head')[0].appendChild(imported);
var imported = document.createElement('script');
imported.src = 'npm/dist/main.js';
document.getElementsByTagName('head')[0].appendChild(imported);
var imported = document.createElement('script');
imported.src = 'js/normalize-url.js';
document.getElementsByTagName('head')[0].appendChild(imported);

const PAGE_404 = browser.runtime.getURL('error_page/almonit-error.html');

// global variables
var local_ENS = {}; // a local ENS of all names we discovered
var ens_domain = ''; // domain in current call
var ipfs_gateway = 'https://ipfs.io/ipfs/';

// extract a domain from url
function urlDomain(data) {
	var matches = data.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	if (matches[1].substring(0, 4) == 'www.')
		return matches[1].substring(4, matches[1].length);
	return matches[1];
}

// refer all .eth requests to the "listener" function
browser.webRequest.onBeforeRequest.addListener(
	listener,
	{ urls: ['http://*.eth/*'], types: ['main_frame'] },
	['blocking']
);

function getENSContent(msg) {
	// from here -> ipfsAddresfromContent -> ipfsAddressfromHex
	return WEB3ENS.getContent(ens_domain).then(ipfsAddressfromContent, err);
}

function ipfsAddressfromContent(hex) {
	if (hex.slice(0, 2) == '0x') return ipfsAddressfromHex(hex.slice(2));
	else return err('ENS content exist but does not point to an IPFS address');
}

// get ENS content from name (returns an object)
function getENSContenthash(address) {
	var dig = address.slice(14);
	return ipfsAddressfromHex(dig);
}

function ipfsAddressfromHex(hex) {
	dig = Multihashes.fromHexString(hex);
	var ipfs_buffer = Multihashes.encode(dig, 18, 32);
	var ipfshash = Multihashes.toB58String(ipfs_buffer);
	local_ENS[ipfshash] = ens_domain;
	var ipfsaddress = ipfs_gateway + ipfshash;
	return {
		redirectUrl: ipfsaddress
	};
}

function err(msg) {
	console.warning(msg);
}

// redirect .eth request to ipfs address from ENS
function listener(details) {
	ens_domain = urlDomain(details.url);
	return WEB3ENS.getContenthash(ens_domain)
		.then(getENSContenthash, getENSContent)
		.catch(err => {
			return { redirectUrl: PAGE_404 };
		});
}

//// listen to messages from content script
browser.runtime.onMessage.addListener(passEnsName);

function passEnsName(request, sender, sendResponse) {
	if (!!request.normalizeURL) {
		const normalizedUrl = normalizeUrl(request.normalizeURL, {
			forceHttp: true
		});
		sendResponse({ response: normalizedUrl });
	} else if (request.theme == 'set_original_theme') {
		browser.theme.reset(window.id);
	} else if (request.theme == 'set_almonit_theme') {
		browser.theme.update(window.id, almonittheme);
	} else if (local_ENS[request.ipfsAddress]) {
		sendResponse({ response: local_ENS[request.ipfsAddress] });
		browser.theme.update(window.id, almonittheme);
	}
}

// theme related code
const almonittheme = {
	images: {
		theme_frame: 'theme/lion_header.png'
	},
	colors: {
		frame: '#adb09f',
		tab_background_text: '#000'
	}
};
