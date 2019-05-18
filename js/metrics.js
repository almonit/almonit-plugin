var server = "http://127.0.0.1:1981";

class Metrics {
	constructor() {
		this.reportThreshold = 10; //report every reportThreshold visits
	}

	add(site) {
		browser.storage.local.get("saved_metrics")
			.then(item => this.addSitetoMetrics(item, site)); 
	}
}

Metrics.prototype.addSitetoMetrics = function(item, site) {
	var saved_metrics = item.saved_metrics;	

	if (saved_metrics.hasOwnProperty(site)) {
		saved_metrics[site] = saved_metrics[site] + 1;
	} else {
		saved_metrics[site] = 1;
	}
	
	browser.storage.local.set({saved_metrics});
	browser.storage.local.get('usage_counter').then(item => this.isReportNeeded(item));
}

Metrics.prototype.isReportNeeded = function(item) {
	if ( (item.usage_counter % this.reportThreshold == 0) &&
			 (item.usage_counter > 0) ) {
		browser.storage.local.get("saved_metrics").then(reportMetrics, err);
	}
}

function reportMetrics(item) {
	let saved_metrics = {}
	browser.storage.local.set({saved_metrics});

	var socket = io.connect(server);				
	socket.emit("metrics",JSON.stringify(item.saved_metrics));
}

// This is here instead of in background.js, since code in background.js is evaluated before metrics.js is loaded
var metrics = new Metrics();
