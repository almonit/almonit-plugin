var server = "http://127.0.0.1:1981";

class Metrics {
	constructor() {
		this.permission = false;
		this.reportThreshold = 3; //report every reportThreshold visits
		this.loadConfig();
	}
		
	loadConfig() {
		browser.storage.local.get('metrics_permission')
			.then(this.setPermission, err);
	}

	add(site) {
		browser.storage.local.get(site)
			.then(item => this.addSitetoMetric(item, site)); 
	}
}

Metrics.prototype.addSitetoMetric = function(item, site) {
	if (Object.entries(item).length !== 0) {
		browser.storage.local.set({[site]: item[site] + 1});
		browser.storage.local.get('usage_counter').then(item => this.isReportNeeded(item));
	} else {
		browser.storage.local.set({[site]: 1});
	}
}

Metrics.prototype.isReportNeeded = function(item) {
	if ( (Object.entries(item).length != 0) && (item.usage_counter % this.reportThreshold == 0) 
																				&& (item.usage_counter > 0) ) {
		//report metrics to server
		browser.storage.local.get().then(reportMetrics, err);
	}
}

Metrics.prototype.setPermission = function(item) {
	if (item.metrics_permission !== true) 
		this.permission = false;
	else 
		this.permission = true;
}

function reportMetrics(item) {
	console.log("start reporting metrics");
	// delete all old data, and rewrite the settings variables
	browser.storage.local.clear();
	browser.storage.local.set({"usage_counter": item.usage_counter});
	browser.storage.local.set({"metrics_permission": item.metrics_permission});

	// prepare item: remove settings variables
	delete item.usage_counter;
	delete item.metrics_permission;
	
	var socket = io.connect(server);				
	socket.emit("metrics",JSON.stringify(item));
	console.log("end reporting metrics");
}

// This is here instead of in background.js, since code in background.js is evaluated before metrics.js is loaded
var metrics = new Metrics();
