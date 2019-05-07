document.getElementById("authorize").addEventListener("click", metricsAuthorize)
document.getElementById("deny").addEventListener("click", metricsDeny)

function metricsAuthorize() { 
	browser.storage.local.get('ENS_redirect_url')
		.then(function(item) {
			console.log(item);
			browser.storage.local.remove('ENS_redirect_url');
			var sending = browser.runtime.sendMessage({
      	permission: "true",
				first_site: item.ENS_redirect_url
				
    	});
			sending;
			window.location.replace(item.ENS_redirect_url);
		}, err);
}

function metricsDeny() { 
	browser.storage.local.get('ENS_redirect_url')
		.then(function(item) {
			browser.storage.local.remove('ENS_redirect_url');
			var sending = browser.runtime.sendMessage({
      	permission: "false"
    	});
			sending;
			window.location.replace(item.ENS_redirect_url);
		}, err);
}

function err(msg) { 
	console.warn(msg);
}
