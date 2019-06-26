var server = "http://95.179.128.10:1981";

class Metrics {
	constructor() {
		this.reportThreshold = 100; //report every reportThreshold visits
	}

	add(site) {
		browser.storage.local.get("savedMetrics")
			.then(item => this.addSitetoMetrics(item, site)); 
	}
}

Metrics.prototype.addSitetoMetrics = function(item, site) {
	var savedMetrics = item.savedMetrics;	

	if (savedMetrics.hasOwnProperty(site)) {
		savedMetrics[site] = savedMetrics[site] + 1;
	} else {
		savedMetrics[site] = 1;
	}
	
	browser.storage.local.set({savedMetrics});
	browser.storage.local.get('usageCounter').then(item => this.isReportNeeded(item));
}

Metrics.prototype.isReportNeeded = function(item) {
	if ( (item.usageCounter % this.reportThreshold == 0) &&
			 (item.usageCounter > 0) ) {
		browser.storage.local.get("savedMetrics").then(reportMetrics, err);
	}
}

function reportMetrics(item) {
	let savedMetrics = {}
	browser.storage.local.set({savedMetrics});

	var socket = io.connect(server);				
	socket.emit("metrics",JSON.stringify(item.savedMetrics));
}

// This is here instead of in background.js, since code in background.js is evaluated before metrics.js is loaded
var metrics = new Metrics();
