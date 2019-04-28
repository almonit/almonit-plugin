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

// document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById('settingsForm').addEventListener('submit', saveOptions);
