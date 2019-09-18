const url = document.getElementById('url');
const shuffleBtn = document.getElementById('shuffleBtn');

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
	timeOffset: 2,
	needUpdate: false
});

// const buttonText = new WordShuffler(shuffleBtn, {
// 	textColor: '#fff',
// 	timeOffset: 4,
// 	needUpdate: false
// });

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
		'blog.almonit.eth',
		'portalnetwork.eth',
		'mycrypto.dappnode.eth',
		'doracle.eth',
		'pricefeed.doracle.eth',
		'kitsune-wallet.eth',
		'pac-txt.eth',
		'digitallyrare.eth',
		'game.portalnetwork.eth',
		'web3casino.eth',
		'lilsiri.eth',
		'pepesza.eth',
		'monkybrain.eth',
		'christophershen.eth',
		'phyrextsai.eth',
		'cv.gnelson.eth',
		'maxl.eth',
		'mattcondon.eth',
		'hadriencroubois.eth',
		'web.destiner.eth',
		'alexfisher.eth',
		'johnkane.eth',
		'waydereitsma.eth',
		'obernardovieira.eth',
		'hozt.portalnetworkweb.eth',
		'badger.merklework.eth',
		'ownpaste.eth',
		'liquid-long.keydonix.eth',
		'liquid-close.keydonix.eth',
		'turmsamt.eth',
		'ensmanager.matoken.eth',
		'atmarketplace.eth',
		'tornadocash.eth',
		'amoebacore.eth',
		'eternalword.eth',
		'nathanclayforcongress.eth',
		'bradsherman.eth',
		'oppailand.eth'
	];

	return urlList[getRandomInt(urlList.length)];
}

shuffleBtn.addEventListener('click', function() {
	const rs = randomSuggestion();
	url.href = `http://${rs}`;
	urlText.restart(rs);
	//buttonText.restart();
});
