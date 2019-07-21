const url = document.getElementById('url');
const shuffleBtn = document.getElementById('shuffleBtn');

let isFirefox;

function checkBrowser() {
	if (typeof browser === 'undefined') {
		browser = chrome;
	} else {
		isFirefox = true;
	}
	return;
}

checkBrowser();

if (!isFirefox) {
	window.addEventListener('click', function(e) {
		if (e.target.parentElement.href !== undefined) {
			browser.tabs.create({
				active: true,
				url: e.target.parentElement.href
			});
		}
	});
}

const urlText = new WordShuffler(url, {
	textColor: '#0078e7',
	timeOffset: 4,
	needUpdate: false
});

const buttonText = new WordShuffler(shuffleBtn, {
	textColor: '#fff',
	timeOffset: 4,
	needUpdate: false
});

const uniqueRandoms = [];

function getRandomInt(max) {
	if (!uniqueRandoms.length) {
		for (let i = 0; i < max; i++) {
			uniqueRandoms.push(i);
		}
	}
	const index = Math.floor(Math.random() * uniqueRandoms.length);
	const val = uniqueRandoms[index];

	uniqueRandoms.splice(index, 1);

	return val;
}

function randomSuggestion() {
	const urlList = [
		'pepesza.eth',
		'almonit.eth',
		'portalnetwork.eth',
		'monkybrain.eth',
		'badger.merklework.eth',
		'amoebacore.eth',
		'hozt.portalnetworkweb.eth',
		'christophershen.eth',
		'phyrextsai.eth',
		'mycrypto.dappnode.eth',
		'myetherwallet.eth',
		'game.portalnetwork.eth',
		'cv.gnelson.eth',
		'mycrypto.dappnode.eth',
		'myetherwallet.eth',
		'game.portalnetwork.eth',
		'cv.gnelson.eth',
		'forkslowtrade.eth',
		'digitallyrare.eth',
		'neelyadav.eth',
		'mattcondon.eth',
		'nathanclayforcongress.eth',
		'bradsherman.eth',
		'liquid-long.keydonix.eth',
		'hadriencroubois.eth',
		'badger.merklework.eth',
		'pricefeed.doracle.eth',
		'web.destiner.eth',
		'alexfisher.eth',
		'turmsamt.eth',
		'ensmanager.matoken.eth'
	];

	return urlList[getRandomInt(urlList.length)];
}

shuffleBtn.addEventListener('click', function() {
	const rs = randomSuggestion();
	url.href = `http://${rs}`;
	urlText.restart(rs);
	buttonText.restart();
});
