var url = new URL(window.location.href);
var ensDomain = url.searchParams.get('redirect');
var ensPath = url.searchParams.get('path');

promisify(browser.runtime, 'sendMessage', [
	{
		resolveUrl: [ensDomain, ensPath]
	}
]).then(response => {
	window.location.href = response;
});
