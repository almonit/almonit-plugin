function saveOptions(e) {
    e.preventDefault();
    console.log('Changes are saved!');
    // browser.storage.sync.set({
    //   metrics: document.querySelector("#metrics").value
    // });
}

function restoreOptions() {
    function setCurrentChoice(result) {
        document.querySelector('#metrics').value = result.metrics || false;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get('metrics');
    getting.then(setCurrentChoice, onError);
}

function hotkeyListener(e) {
    console.log(String.fromCharCode(e.which));
}

// Examples of applying selected radio buttons (ethereum radio group)
document.forms['settingsForm'].ethereum[1].checked=true;
// Examples of applying selected radio buttons (gateway radio group)
document.forms['settingsForm'].gateway[1].checked=true;

// document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById('settingsForm').addEventListener('submit', saveOptions);
document
    .getElementById('hotkeyBarInput')
    .addEventListener('keyup', hotkeyListener);
document
    .getElementById('hotkeySettingsInput')
    .addEventListener('keyup', hotkeyListener);
