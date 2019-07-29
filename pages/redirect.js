promisify(browser.runtime, 'sendMessage', [
	{
		resolveUrl: true
	}
]).then(response => {
	window.location.href = response;
});
