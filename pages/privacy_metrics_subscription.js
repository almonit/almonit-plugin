document.getElementById("authorize").addEventListener("click", metricsAuthorize)
document.getElementById("deny").addEventListener("click", metricsDeny)

function metricsAuthorize() { 
	browser.storage.local.get('ENS_redirect_url')
		.then(function(item) {
			browser.storage.local.remove('ENS_redirect_url');
			browser.storage.local.set({'metrics_permission': true});
			var sending = browser.runtime.sendMessage({
      	permission: "permission_true",
				first_site: item.ENS_redirect_url.url
				
    	});
			sending.then(function(msg) {console.log(msg)}, err);
			window.location.replace(item.ENS_redirect_url.url);
		}, err);
}

function metricsDeny() { 
	browser.storage.local.get('ENS_redirect_url')
		.then(function(item) {
			browser.storage.local.remove('ENS_redirect_url');
			browser.storage.local.set({'metrics_permission': false});
			window.location.replace(item.ENS_redirect_url.url);
		}, err);
}

function err(msg) { 
	console.warn(msg);
}
