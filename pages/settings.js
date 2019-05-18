var ipfs_gateways = new Object();

function restoreSettings() {
    function setCurrentSettings(result) {
        settings = result.settings;

        // metric permission
        if (settings.metrics_permission !== true) {
            document.querySelector('#metricCheckbox').checked = false;
        } else document.querySelector('#metricCheckbox').checked = true;

        // ethereum client
				document.getElementById('urlInput').value = "";
				ethereum_select = document.forms['settingsForm'].ethereum;
			  switch (settings.ethereum) {
					case "infura":
						ethereum_select[0].checked = true;
						break;	
					case "local":
						ethereum_select[1].checked = true;
						break;	
					default:
						ethereum_select[2].checked = true;
						document.getElementById('urlInput').disabled = false;
						document.getElementById('urlInput').value = settings.ethereum;	
				}	
				

        // list of ipfs gateways
        Object.keys(result.settings.gateways).forEach(function(key, index) {
            addIpfsGate(key, result.settings.gateways[key], index);
        });

        // ipfs gateway settings
				if (settings.ipfs == "random")
	        document.forms['settingsForm'].gateway[0].checked = true;
				else {
	        document.forms['settingsForm'].gateway[1].checked = true;
					document.getElementById('ipfs_gateways').disabled = false;
				}

        // set session paramters
        var get_session = browser.storage.local.get('session');
        get_session.then(setCurrentSession, onError);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    function setCurrentSession(result) {
        select = document.getElementById('ipfs_gateways');
				select.selectedIndex = ipfs_gateways[result.session.ipfs_gateway];
        
				current_gateway = select[select.selectedIndex].text;
				document.getElementById('current_gateway').innerHTML = current_gateway;
    }

    var get_settings = browser.storage.local.get('settings');
    get_settings.then(setCurrentSettings, onError);
}

function saveSettings(e) {
    e.preventDefault();

    // collect settings data
    let metrics_permission = document.querySelector('#metricCheckbox').checked;
    if (document.forms['settingsForm'].ethereum.value !== "other")
			var ethereum = document.forms['settingsForm'].ethereum.value;
		else
			var ethereum = document.getElementById('urlInput').value;

    let gateways = {};

		// TODO: upadte for managed gateways once UI for it exists
    let gateways_list = document.getElementById('ipfs_gateways');
    for (i = 0; i < gateways_list.length; i++) {
        let gateway = JSON.parse(gateways_list[i].value);
        gateways[gateway.key] = gateway.value;
    }

		if (document.forms['settingsForm'].gateway.value == "random") 
	    var ipfs = "random";
		else
			var ipfs = document.getElementById('ipfs_gateways').value;

    let shortcuts = {
        addressbar: 'Ctrl + Shift + T',
        settings: 'Ctrl + Shift + O'
    };

    // create and save settings
    let settings = {
        metrics_permission: metrics_permission,
        ethereum: ethereum,
        gateways: gateways,
        ipfs: ipfs,
        shortcuts: shortcuts
    };
    browser.storage.local.set({ settings });

	browser.runtime.sendMessage({
  	reload_settings: true
  });
}

function hotkeyListener(e) {
    console.log(String.fromCharCode(e.which));
}

document.addEventListener('DOMContentLoaded', restoreSettings);
document
    .getElementById('settingsForm')
    .addEventListener('submit', saveSettings);
document
    .getElementById('hotkeyBarInput')
    .addEventListener('keyup', hotkeyListener);
document
    .getElementById('hotkeySettingsInput')
    .addEventListener('keyup', hotkeyListener);

// Radio group listeners

function radioGroupListener(e) {
    if (e.target.getAttribute('name') === 'ethereum') {
        document.getElementById('urlInput').disabled =
            e.target.value !== 'other';
    } else if (e.target.getAttribute('name') === 'gateway') {
        document.getElementById('ipfs_gateways').disabled =
            e.target.value !== 'force_gateway';
    }
}

document.addEventListener('click', radioGroupListener);

function addIpfsGate(key, value, index) {
    ipfs_gateways[value] = index;

    var option = document.createElement('option');
    var gateways = document.getElementById('ipfs_gateways');
    option.text = key + ': ' + value;
    option.value = JSON.stringify({ key: key, value: value });
    gateways.add(option);
}

/**
 * Enumerates
 */
const eth_client = {
    infura: 0,
    local: 1,
    other: 2
};

const ipfs_options = {
    random: 0,
    force_gateway: 1
};
