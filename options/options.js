// restoreOptions();
var ipfs_gateways = new Object();


function restoreSettings() {
    function setCurrentSettings(result) {
			settings = result.settings;		
	
      // metric permission
      if (settings.metrics_permission !== true) { 
				document.querySelector('#metricCheckbox').checked = false;
			}
			else
				document.querySelector('#metricCheckbox').checked = true;
			
      // ethereum client
			document.forms['settingsForm'].ethereum[eth_client[settings.ethereum]].checked=true;

      // list of ipfs gateways
			Object.keys(result.settings.gateways).forEach(function(key,index) {	
				addIpfsGate(key,result.settings.gateways[key], index);
			});

      // ipfs gateway option
			document.forms['settingsForm'].gateway[ipfs_options[settings.ipfs]].checked=true;
    
      // set session paramters
      var get_session = browser.storage.local.get('session');
      get_session.then(setCurrentSession, onError);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    function setCurrentSession(result) {
      select = document.getElementById("ipfs_gateways1");
			current_text = select[ipfs_gateways[result.session.ipfs_gateway]].text;

			select[ipfs_gateways[result.session.ipfs_gateway]].text = current_text + " (current gate)";

      document.getElementById("ipfs_gateways1").selectedIndex = ipfs_gateways[result.session.ipfs_gateway];
		}

    var get_settings = browser.storage.local.get('settings');
    get_settings.then(setCurrentSettings, onError);
}

function saveSettings(e) {
  e.preventDefault();

  // collect settings data
  let metrics_permission = document.querySelector('#metricCheckbox').checked;
  let ethereum = document.forms['settingsForm'].ethereum.value;
  
  let gateways = {};
  let gateways_list = document.getElementById("ipfs_gateways1");
  for (i=0; i<gateways_list.length; i++) {
    let gateway = JSON.parse(gateways_list[i].value);
    gateways[gateway.key] = gateway.value;
  }

  let ipfs = document.forms['settingsForm'].gateway.value;

  let shortcuts = {
    "addressbar": "Ctrl + Shift + T",
    "settings": "Ctrl + Shift + O"
  }

  // create and save settings
  let settings = {
    "metrics_permission": metrics_permission,
    "ethereum": ethereum,
    "gateways": gateways,
    "ipfs": ipfs,
    "shortcuts": shortcuts
  }
  browser.storage.local.set({settings});

  // TODO: create and save session settings
}

function hotkeyListener(e) {
    console.log(String.fromCharCode(e.which));
}

document.addEventListener("DOMContentLoaded", restoreSettings);
document.getElementById('settingsForm').addEventListener('submit', saveSettings);
document
    .getElementById('hotkeyBarInput')
    .addEventListener('keyup', hotkeyListener);
document
    .getElementById('hotkeySettingsInput')
    .addEventListener('keyup', hotkeyListener);

function addIpfsGate(key,value, index) { 
  ipfs_gateways[value] = index;

	var option1 = document.createElement("option");
	var option2 = document.createElement("option");
	var gateways1 = document.getElementById("ipfs_gateways1");
	var gateways2 = document.getElementById("ipfs_gateways2");
  option1.text = key + ": " + value;
  option1.value = JSON.stringify({"key": key, "value": value});
  option2.text = key + ": " + value;
  option2.value = JSON.stringify({"key": key, "value": value});
  gateways1.add(option1);
  gateways2.add(option2);
}

/**
 * Enumerates
 */
 const eth_client = {
  "infura": 0,
  "local": 1,
  "other": 2
}

const ipfs_options = {
  "random": 0,
  "force_gateway": 1
}