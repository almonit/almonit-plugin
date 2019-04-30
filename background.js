importJS('js/multihashes-min');
importJS('npm/dist/main');
importJS('js/metrics');
importJS('js/socket.io');
importJS('js/normalize-url');

/**** settings ****/
var local_ENS = {}; // a local ENS of all names we discovered
var ens_domain = ''; // domain in current call
//var ipfs_gateway = 'https://ipfs.io/ipfs/';
const PAGE_404 = browser.runtime.getURL('pages/error.html');
const PAGE_OPTIONS = browser.runtime.getURL('options/options.html');

// load a random gateway
browser.storage.local.get('gateways').then(function(item) {
	var keys = Object.keys(item.gateways)
	ipfs_gateway = "https://" + item.gateways[keys[ keys.length * Math.random() << 0]] + "/ipfs/";	
}, err)

const almonittheme = {
	images: {
		theme_frame: 'theme/lion_header.png'
	},
	colors: {
		frame: '#adb09f',
		tab_background_text: '#000'
	}
};

/**** Catch '.ens' requests, read ipfs address from Ethereum and redirect to ENS ****/
browser.webRequest.onBeforeRequest.addListener(
	listener,
	{ urls: ['http://*.eth/*'], types: ['main_frame'] },
	['blocking']
);

function listener(details) {
	ens_domain = urlDomain(details.url);

	// if error in retrieving Contenthash, try general ENS content field
	return WEB3ENS.getContenthash(ens_domain)
		.then(
			function(address) {
				return handleENSContenthash(address, ens_domain);
			},
			function(error) {
				return getENSContent(ens_domain);
			}
		)
		.catch(notFound);
}

function handleENSContenthash(address, ens_domain) {
	return redirectENStoIPFS(address.slice(14), ens_domain);
}

// retrieve general ENS content field
function getENSContent(ens_domain) {
	// from here -> ipfsAddresfromContent -> ipfsAddressfromHex
	return WEB3ENS.getContent(ens_domain).then(function(content) {
		return handleENSContent(content, ens_domain);
	}, notFound);
}

function handleENSContent(hex, ens_domain) {
	if (hex.slice(0, 2) == '0x')
		return redirectENStoIPFS(hex.slice(2), ens_domain);
	else return err('ENS content exist but does not point to an IPFS address');
}

function ipfsAddressfromContent(hex) {
	if (hex.slice(0, 2) == '0x') return ipfsAddressfromHex(hex.slice(2));
	else return err('ENS content exist but does not point to an IPFS address');
}

// extract ipfs address from hex and redirects there
// before redirecting, handling usage metrics
function redirectENStoIPFS(hex, ens_domain) {
	var ipfshash = hextoIPFS(hex);
	var ipfsaddress = ipfs_gateway + ipfshash;

	local_ENS[ipfshash] = ens_domain;

	// update metrics and redirect to ipfs
	return browser.storage.local.get('usage_counter').then(function(item) {
		if (Object.entries(item).length != 0) {
			browser.storage.local.set({
				usage_counter: item.usage_counter + 1
			});
			if (metrics.permission) metrics.add(ens_domain);
			return {
				redirectUrl: ipfsaddress
			};
		} else {
			browser.storage.local.set({ usage_counter: 1 });
			browser.storage.local.set({
				ENS_redirect_url: { url: ipfsaddress, ens_domain: ens_domain }
			});
			return {
				redirectUrl: browser.extension.getURL(
					'pages/privacy_metrics_subscription.html'
				)
			};
		}
	}, err);
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

/**** communicating with frontend scripts ****/
browser.runtime.onMessage.addListener(MessagefromFrontend);

function MessagefromFrontend(request, sender, sendResponse) {
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
	} else if (request.permission == 'permission_true') {
		metrics.permission = true;
		let ipfs_location = request.first_site.lastIndexOf('ipfs');
		let ipfsaddress = request.first_site.substring(
			ipfs_location + 5,
			request.first_site.length
		);
		metrics.add(local_ENS[ipfsaddress]);
	} else if (!!request.options) {
		var optionsTab = browser.tabs.create({
	    	url: PAGE_OPTIONS
	  	})
	}
}

/**** installation ****/
browser.runtime.onInstalled.addListener(handleInstalled);
function handleInstalled(details) {

	// TOOD: gateways as a global variable, loading once when the browser is opened
	var gateways = {
    "Ipfs": "ipfs.io",
    "Siderus": "siderus.io",
    "Eternum": "ipfs.eternum.io",
    "Infura": "ipfs.infura.io",
    "Hardbin": "hardbin.com",
    "Wahlers": "ipfs.wa.hle.rs",
    "Cloudflare": "cloudflare-ipfs.com",
    "Temporal": "gateway.temporal.cloud",
    "serph": "gateway.serph.network"
	} 

	browser.storage.local.set({gateways});
}

/**** auxillary functions ****/
function hextoIPFS(hex) {
	var dig = Multihashes.fromHexString(hex);
	var ipfs_buffer = Multihashes.encode(dig, 18, 32);
	var ipfshash = Multihashes.toB58String(ipfs_buffer);

	return ipfshash;
}

// extract a domain from url
function urlDomain(data) {
	var matches = data.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	if (matches[1].substring(0, 4) == 'www.')
		return matches[1].substring(4, matches[1].length);
	return matches[1];
}

function importJS(file) {
	var imported = document.createElement('script');
	imported.src = file + '.js';
	document.getElementsByTagName('head')[0].appendChild(imported);
}

function notFound(e) {
	console.log("err: " + e);
	return { redirectUrl: PAGE_404 };
}

function err(msg) {
	console.warn(msg);
}