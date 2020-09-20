const htmlMime = 'text/html';
const addGatewayPanel = document.getElementById('addGatewayPanel');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
var ethereumGateways;
var ipfsGateways;
var skynetGateways;

/**
 * Click events
 */
document.addEventListener('DOMContentLoaded', loadSettings);
document
    .getElementById('settingsForm')
    .addEventListener('submit', saveSettings);
document
    .getElementById('ModifyShortcutBarInput')
    .addEventListener('click', e => shortcutListener('shortcutBarInput', e));
document
    .getElementById('ModifyShortcutSettingsInput')
    .addEventListener('click', e =>
        shortcutListener('shortcutSettingsInput', e)
    );

document
    .getElementById('restoreDefaultEthereumGatewaysButton')
    .addEventListener('click', e =>
        restoreDefaultGateways(e, ethereumGateways, 'ethereum')
    );
document
    .getElementById('restoreDefaultIpfsGatewaysButton')
    .addEventListener('click', e =>
        restoreDefaultGateways(e, ipfsGateways, 'ipfs')
    );
document
    .getElementById('restoreDefaultSkynetGatewaysButton')
    .addEventListener('click', e =>
        restoreDefaultGateways(e, skynetGateways, 'skynet')
    );

document
    .getElementById('manageEthereumGatewaysButton')
    .addEventListener('click', e =>
        openGatewayModal(e, ethereumGateways, 'ethereum')
    );
document
    .getElementById('manageIpfsGatewaysButton')
    .addEventListener('click', e => openGatewayModal(e, ipfsGateways, 'ipfs'));
document
    .getElementById('manageSkynetGatewaysButton')
    .addEventListener('click', e =>
        openGatewayModal(e, skynetGateways, 'skynet')
    );

document
    .getElementById('ethereumRadioButtons')
    .addEventListener('click', e => radioGroupListener(e, 'ethereum'));
document
    .getElementById('ipfsRadioButtons')
    .addEventListener('click', e => radioGroupListener(e, 'ipfs'));
document
    .getElementById('skynetRadioButtons')
    .addEventListener('click', e => radioGroupListener(e, 'skynet'));

for (let tab of tabs) {
    tab.addEventListener('click', tabListener);
}

/**
 * Load settings into form, this function has a few functions within it
 */
function loadSettings() {
    const manifest = browser.runtime.getManifest();
    document.getElementById('appVersion').textContent = `(v${
        manifest.version
    })`;

    /**
     * [Fetches settings from local storage, shows them in settings.html form]
     * @param {Object}      result      [async result of local storage]
     */
    function loadCurrentSettings(result) {
        settings = result.settings;

        console.log("aadsfsaf");

        // init
        document.getElementById('ethereumOtherGateway').value = '';
        document.getElementById('ipfsOtherGateway').value = '';
        document.getElementById('skynetOtherGateway').value = '';

        // autoupdated (enabled by default)
        if (settings.autoGatewaysUpdate !== false) {
            document.querySelector(
                '#autoGatewaysUpdateCheckbox'
            ).checked = true;
        } else
            document.querySelector(
                '#autoGatewaysUpdateCheckbox'
            ).checked = false;

        // Rinkeby testnet ENS support (disabled by default)
        if (settings.rinkebyTestnet !== true) {
            document.querySelector(
                '#rinkebyTestnetCheckbox'
            ).checked = false;
        } else
            document.querySelector(
                '#rinkebyTestnetCheckbox'
            ).checked = true;

        // gateways settings
        ethereumGateways = new Gateways(settings.ethereumGateways);
        ipfsGateways = new Gateways(settings.ipfsGateways);
        skynetGateways = new Gateways(settings.skynetGateways);

        loadGateways(ethereumGateways, 'ethereum');
        loadGateways(ipfsGateways,  'ipfs');
        loadGateways(skynetGateways, 'skynet');

        // shortcuts
        document.getElementById('shortcutBarInput').value =
            settings.shortcuts.addressbar;
        document.getElementById('shortcutSettingsInput').value =
            settings.shortcuts.settings;
    }

    function loadGateways(gws, label) {
        let gatewaysList = gws.getGatewaysList();
        Object.keys(gatewaysList).forEach(function(key, index) {
            addGatewayToSelectbox(label + 'Gateways', gatewaysList[key]);
        });

        switch (gws.option) {
            case 'random':
                document.forms['settingsForm'][label][0].checked = true;
                break;
            case 'force_gateway':
                document.forms['settingsForm'][label][1].checked = true;
                document.getElementById(label + 'Gateways').disabled = false;
                break;
            case 'other_gateway':
                document.forms['settingsForm'][label][2].checked = true;
                document.getElementById(
                    label + 'OtherGateway'
                ).disabled = false;
                document.getElementById(label + 'OtherGateway').value =
                    gws.currentGateway.address;
        }

        let selectbox = document.getElementById(label + 'Gateways');
        if (gws.option != 'other_gateway') {
            selectbox.value = gws.currentGateway.key;
        } else 
            selectbox.value = selectbox[0].id; //we show first value to keep box non-empty

        setCurrentGateway(gws, label);

        document.getElementById(label + "NoNewRandomWhenSaving").checked = gws.noNewRandomWhenSaving;
    }

    let getSettings = promisify(browser.storage.local, 'get', ['settings']);
    getSettings.then(loadCurrentSettings, onError);
}

/**
 * [write setting into local storage]
 * @param  {[Object]} e [Event handler]
 */
function saveSettings(e) {
    e.preventDefault();

    // collect settings data
    updateGatewaysValuesByForm(ethereumGateways, 'ethereum');
    updateGatewaysValuesByForm(ipfsGateways, 'ipfs');
    updateGatewaysValuesByForm(skynetGateways, 'skynet');

    let AutoGatewaysUpdate = document.querySelector(
        '#autoGatewaysUpdateCheckbox'
    ).checked;

    let RinkebyTestnet = document.querySelector(
        '#rinkebyTestnetCheckbox'
    ).checked;

    let shortcuts = {
        addressbar: document.getElementById('shortcutBarInput').value,
        settings: document.getElementById('shortcutSettingsInput').value
    };

    // create, save and send 'reloadSettings' settings
    let settings = {
        autoGatewaysUpdate: AutoGatewaysUpdate,
        rinkebyTestnet: RinkebyTestnet,
        ethereumGateways: ethereumGateways,
        ipfsGateways: ipfsGateways,
        skynetGateways: skynetGateways,
        shortcuts: shortcuts,
        version: browser.runtime.getManifest().version
    };
    promisify(browser.storage.local, 'set', [{ settings }]);

    promisify(browser.runtime, 'sendMessage', [
        {
            reloadSettings: true
        }
    ]);

    msgAlert('Settings saved', 1000);
}

function setCurrentGateway(gws, label) {
    let currentGateway;
    if (gws.option != 'other_gateway') 
        currentGateway = gws.currentGateway.name;
    //for 'other' the key and name both set to 'other', so we use 'adddres'
    else
        currentGateway =
            gws.currentGateway.name + ': ' + gws.currentGateway.address;
    document.getElementById(
        label + 'CurrentGateway'
    ).textContent = currentGateway;
}

function restoreDefaultGateways(e, gws, label) {
    gws.restoreToDeafult();

    // clear select input
    let select = document.getElementById(label + 'Gateways');
    let length = select.options.length;
    for (i = length - 1; i >= 0; i--) {
        select.options[i] = null;
    }

    // add gateway to select input
    let gatewaysList = gws.getGatewaysList();
    Object.keys(gatewaysList).forEach(function(key, index) {
        addGatewayToSelectbox(label + 'Gateways', gatewaysList[key]);
    });

    setCurrentGateway(gws, label);

    msgAlert('Default ' + label + ' gateways list restored', 1000);
}

/**
 * [update object gws (Gatewys) with label 'label' based on data in the form]
 */
function updateGatewaysValuesByForm(gws, label) {
    gws.noNewRandomWhenSaving = document.getElementById(label + 'NoNewRandomWhenSaving').checked;

    switch (document.forms['settingsForm'][label].value) {
        case label + 'Random':
            gws.setGatewayOptions('RANDOM');
            if (!gws.noNewRandomWhenSaving)
                gws.currentGateway = gws.getRandom();
            break;
        case label + 'Force':
            let key = document.getElementById(label + 'Gateways').value;
            gws.setGatewayOptions('FORCE', key);

            // update view
            document.getElementById(label + 'OtherGateway').value = '';
            break;
        case label + 'Other':
            let other = document.getElementById(label + 'OtherGateway').value;
            gws.setGatewayOptions('OTHER', other);
    }

    //update selection in selectBox 
    let selectbox = document.getElementById(label + 'Gateways');
    if (gws.option != 'other_gateway') {
        selectbox.value = gws.currentGateway.key;
    } else 
        selectbox.value = selectbox[0].id; //we show first value to keep box non-empty

    setCurrentGateway(gws, label);
}

/**
 * [shortcutListener read key inputs of user on shortcutInputs to assign new combinations]
 * @param  {[Object]} e [Event handler]
 */
function shortcutListener(shortcut, e) {
    document.getElementById('field_disabel_form').disabled = true;
    document.activeElement.blur();
    document.addEventListener('keydown', function handleShortcut(e) {
        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            handleShortcuts(shortcut, e);
            this.removeEventListener('keydown', arguments.callee);
        }
    });
}

function handleShortcuts(shortcut, e) {
    e.stopPropagation();
    e.preventDefault();
    let keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)
        ? ''
        : e.key;
    let reportStr =
        (e.ctrlKey ? 'Ctrl+' : '') +
        (e.shiftKey ? 'Shift+' : '') +
        (e.altKey ? 'Alt+' : '') +
        (e.metaKey ? 'Meta+' : '') +
        keyStr;

    let currentBarShortcut = document.getElementById('shortcutBarInput').value;
    let currentSettingsShortcut = document.getElementById(
        'shortcutSettingsInput'
    ).value;
    if (
        (shortcut == 'shortcutBarInput' &&
            currentSettingsShortcut == reportStr) ||
        (shortcut == 'shortcutSettingsInput' && currentBarShortcut == reportStr)
    )
        alert(reportStr + ' is already used as another shortcut');
    else document.getElementById(shortcut).value = reportStr;

    document.getElementById('field_disabel_form').disabled = false;
}

/**
 * [createGatewayForm will create add or edit form
 *  whenever user clicks add/edit action buttons in modal]
 * @param  {[Object]}       item (Optional)     [Gateway object]
 * @param  {[String]}       btnName             [Form submit button name/text]
 * @param  {[Object]}       e                   [Event handler]
 */
function createGatewayForm(item, gws, label, btnName, callback, e) {
    e.stopPropagation();
    removeChilds(addGatewayPanel);
    const addGatewayNameInput = document.createElement('input');
    const addGatewayURLInput = document.createElement('input');
    const saveGatewayURLButton = document.createElement('button');
    addGatewayNameInput.setAttribute('id', 'name_of_gateway');
    addGatewayNameInput.setAttribute('placeholder', 'Name of Gateway');
    addGatewayURLInput.setAttribute('id', 'URL_of_gateway');
    addGatewayURLInput.setAttribute('placeholder', 'URL of Gateway');
    saveGatewayURLButton.className = 'pure-button pure-button-primary';
    saveGatewayURLButton.appendChild(document.createTextNode(btnName));
    const addGatewayForm = document.createElement('form');

    if (item) {
        addGatewayNameInput.value = item.name;
        addGatewayURLInput.value = item.key;
    }

    addGatewayForm.appendChild(addGatewayNameInput);
    addGatewayForm.appendChild(addGatewayURLInput);
    addGatewayForm.appendChild(saveGatewayURLButton);
    addGatewayPanel.appendChild(addGatewayForm);
    saveGatewayURLButton.setAttribute('type', 'button');
    if (item)
        saveGatewayURLButton.addEventListener('click', e =>
            callback(e, item, gws, label)
        );
    else
        saveGatewayURLButton.addEventListener('click', e =>
            callback(e, gws, label)
        );
    addGatewayNameInput.focus();
}

function addGatewayToSelectbox(selectboxID, gateway) {
    let option = document.createElement('option');
    let gateways = document.getElementById(selectboxID);
    option.text = gateway.name + ': ' + gateway.key;
    option.value = gateway.key;
    option.id = gateway.key;
    gateways.add(option);
}

/**
 * Gatways modal functions
 */
/**
 * [openGatewayModal will populate current elements of gateway into the modal gateway list
 *  will assign event handlers for action buttons, will make modal visible later ]
 * @param  {[Object]} e [Event handler]
 * @param  {string} gw [gateways object]
 * @param  {string} gwtype [gateway type, e.g., 'ipfs', 'ethereum' etc.]
 */
function openGatewayModal(e, gws, label) {
    const listenerCollector = [];

    const gatewayModal = document.getElementById('gatewayModal');
    const modalGatewaysList = document.getElementById('modalGatewaysList');

    const gatewaysSelect = document.getElementById(label + 'Gateways');

    const type = label;
    const gatewaysListHTMLElement = document.getElementById(label + 'Gateways');

    showGatewayModal();

    function showGatewayModal() {
        let typeGatewaysList = gws.getGatewaysList();

        Object.keys(typeGatewaysList).forEach(function(gate, i) {
            const gatewayLI = document.createElement('li');
            const gatewayTextSpan = document.createElement('span');
            const gatewayEditButtonSpan = document.createElement('span');
            const gatewayRemoveButtonSpan = document.createElement('span');
            gatewayTextSpan.className = 'gateway-title';
            gatewayTextSpan.appendChild(
                document.createTextNode(
                    typeGatewaysList[gate].name +
                        ': ' +
                        typeGatewaysList[gate].key
                )
            );
            gatewayEditButtonSpan.appendChild(document.createTextNode('Edit'));
            gatewayRemoveButtonSpan.appendChild(
                document.createTextNode('Remove')
            );
            gatewayEditButtonSpan.className = 'edit-gateway-button';
            gatewayRemoveButtonSpan.className = 'remove-gateway-button';

            gatewayLI.appendChild(gatewayTextSpan);
            gatewayLI.appendChild(gatewayEditButtonSpan);
            gatewayLI.appendChild(gatewayRemoveButtonSpan);
            modalGatewaysList.appendChild(gatewayLI);

            let gatewayJSON = { key: gate, name: typeGatewaysList[gate].name };

            // Edit buttons
            gatewayEditButtonSpan.addEventListener(
                'click',
                createGatewayForm.bind(
                    null,
                    gatewayJSON,
                    gws,
                    label,
                    'Edit',
                    editGateway
                )
            );

            listenerCollector[i * 2] = {
                element: gatewayEditButtonSpan,
                evtFunc: createGatewayForm.bind(
                    null,
                    gatewayJSON,
                    gws,
                    label,
                    'Edit',
                    editGateway
                )
            };

            // Remove buttons
            gatewayRemoveButtonSpan.addEventListener(
                'click',
                removeGateway.bind(
                    null,
                    modalGatewaysList.children[i],
                    gatewayJSON,
                    gws,
                    label
                )
            );

            listenerCollector[i * 2 + 1] = {
                element: gatewayRemoveButtonSpan,
                evtFunc: removeGateway.bind(
                    null,
                    modalGatewaysList.children[i],
                    gatewayJSON,
                    gws,
                    label
                )
            };
        });

        // Save button (In edit and add input box)
        addGatewayButton = document.getElementById('addGatewayButton');
        addGatewayButton.addEventListener(
            'click',
            createGatewayForm.bind(null, null, gws, label, 'Save', addGateway)
        );

        listenerCollector[listenerCollector.length] = {
            element: addGatewayButton,
            evtFunc: createGatewayForm.bind(
                null,
                null,
                gws,
                label,
                'Save',
                addGateway
            )
        };

        gatewayModal.style.display = 'flex';
    }

    /**
     * [removeListeners will remove whole assigned click listeners for action buttons]
     */
    function removeListeners() {
        listenerCollector.forEach(item => {
            item.element.removeEventListener('click', item.evtFunc);
        });

        removeChilds(addGatewayPanel);
        const domparser = new DOMParser();
        const addGatewayTemplate =
            '<span id="addGatewayButton"> + Add new gateway</span>';
        const gatewayDOM = domparser.parseFromString(
            addGatewayTemplate,
            htmlMime
        );
        addGatewayPanel.appendChild(gatewayDOM.body.firstChild);
    }

    function hideGatewayModal() {
        removeListeners();
        removeChilds(modalGatewaysList);
        gatewayModal.style.display = 'none';
        gatewayModal.removeEventListener('click', closeGatewayModal);
    }

    /**
     * [closeGatewayModal will detect if user click outside of the modal,
     * then will make modal invisible again]email to stay
     * @param  {[Object]} e [Event handler]
     */
    const closeGatewayModal = function(e) {
        if (!event.target.closest('#gatewayModalPanel')) hideGatewayModal();
    };
    gatewayModal.addEventListener('click', closeGatewayModal);
    document
        .getElementById('DoneModifyingGateway')
        .addEventListener('click', hideGatewayModal);

    /**
     * [addGateway will add a gateway to the gateway list. It first checks that the gateway
     * does not exist already in the list.
     * @param  {[Object]}   item    [Gateway object]
     */
    function addGateway(e, gws, label) {
        e.stopPropagation();
        let name = document.getElementById('name_of_gateway').value;
        let key = document.getElementById('URL_of_gateway').value;
        let address = 'https://' + key;

        if (name == '' || key == '') alert('Name and url can not be empty!');
        else if (gws.isGatewayInList(key))
            alert('Gateway with this url already exists!');
        else {
            let gateway = gws.addCustom(key, name, address);
            addGatewayToSelectbox(label + 'Gateways', gateway);

            hideGatewayModal();
            showGatewayModal();
        }
    }

    /**
     * [editGateway will modify a gateway when user clicks edit action button in modal]
     * @param  {[Object]}   item    [Gateway object]
     */
    function editGateway(e, item, gws, label) {
        if (gws.currentGateway.key == item.key)
            alert("Can't edit current gateway");
        else if (gws.isGatewayInList(item.value))
            alert('Gateway with this url already exists!');
        else if (item.name == '' || item.key == '') {
            alert('Name and url can not be empty!');
        } else {
            //remove gateway's old version
            let gatewaysSelect = document.getElementById(label + 'Gateways');
            let gatewayToRemove = document.getElementById(item.key);
            gatewaysSelect.removeChild(gatewayToRemove);
            gws.removeGateway(item.key);

            //add gateway new version
            let name = document.getElementById('name_of_gateway').value;
            let key = document.getElementById('URL_of_gateway').value;
            let address = 'https://' + key;

            let gateway = gws.modifyGateway(key, name, address);

            addGatewayToSelectbox(label + 'Gateways', gateway);

            hideGatewayModal();
            showGatewayModal();
        }
    }
}

/**
 * [removeGateway will remove gateway when user clicks remove action button in modal]
 * @param  {[Object]}   item    [Gateway object]
 */
function removeGateway(child, item, gws, label, e) {
    e.stopPropagation();

    if (modalGatewaysList.children.length == 1)
        alert("Can't remove gateway, list must include at least one gateway.");
    else if (gws.currentGateway.key == item.key)
        alert(
            item.key +
                ' is the current gateway. Please first change the' +
                ' current gateway and then try this action again.'
        );
    else {
        // remove from gateway modal
        modalGatewaysList.removeChild(child);

        // remove from gateway select option
        let gatewayToRemove = document.getElementById(item.key);

        let gatewaysSelect = document.getElementById(label + 'Gateways');
        gatewaysSelect.removeChild(gatewayToRemove);

        //if a default key, add to removed gateways list
        gws.removeGateway(item.key);
    }
}

/**
 * Auxillary Functions
 */

// Radio group listeners
/**
 * [radioGroupListener, to catch radio group interactions from the page in hacky way]
 * @param  {[Object]} e [Event handler]
 */
function radioGroupListener(e, label) {
    if (
        e.target.value == label + 'Force' ||
        e.target.value == label + 'Other' ||
        e.target.value == label + 'Random'
    ) {
        document.getElementById(label + 'NoNewRandomWhenSaving').disabled = 
            e.target.value !== label + 'Random';
        document.getElementById(label + 'Gateways').disabled =
            e.target.value !== label + 'Force';
        document.getElementById(label + 'OtherGateway').disabled =
            e.target.value !== label + 'Other';
    }
}

function tabListener(event) {
    for (let i = tabs.length; i-- > 0; ) {
        tabs[i].classList.remove('active');
        tabPanels[i].classList.remove('active');
    }
    event.currentTarget.classList.add('active');
    document.getElementById(`${event.currentTarget.id}Tab`).classList.add('active');
}

let removeChilds = function(node) {
    let last;
    while ((last = node.lastChild)) node.removeChild(last);
};

/**
 * [SavedAlert shows a message when a user saves settings.
 * @param  {[Object]}   msg        [message to present]
 * @param  {[Object]}   duration    [duration of the message]
 */
function msgAlert(msg, duration) {
    let msgContent = document.getElementById('SettingsMessageDiv');
    msgContent.innerText = '\n ' + msg;

    msg = document.getElementById('SettingsMessage');
    msg.style.display = 'flex';

    setTimeout(function() {
        msg.style.display = 'none';
    }, duration);
}

function onError(error) {
    console.log(`Error: ${error}`);
}
