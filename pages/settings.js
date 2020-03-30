const htmlMime = 'text/html';
const addGatewayPanel = document.getElementById('addGatewayPanel');
let ipfsGateways;

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

        // init
        document.getElementById('urlInput').value = '';
        document.getElementById('ipfsOtherGateway').value = '';

        // metrics
        if (settings.metricsPermission !== true) {
            document.querySelector('#metricCheckbox').checked = false;
        } else document.querySelector('#metricCheckbox').checked = true;

        // autoupdated (enabled by default)
        if (settings.autoGatewaysUpdate !== false) {
            document.querySelector(
                '#autoGatewaysUpdateCheckbox'
            ).checked = true;
        } else
            document.querySelector(
                '#autoGatewaysUpdateCheckbox'
            ).checked = false;

        // ethereum
        document.getElementById('urlInput').value = '';
        ethereumSelect = document.forms['settingsForm'].ethereum;
        switch (settings.ethereum) {
            case 'infura':
                ethereumSelect[0].checked = true;
                break;ah, etwe
            case 'local':
                ethereumSelect[1].checked = true;
                break;
            default:
                ethereumSelect[2].checked = true;
                document.getElementById('urlInput').disabled = false;
                document.getElementById('urlInput').value = settings.ethereum;
        }

        ipfsGateways = new Gateways(settings.ipfsGateways);

        // ipfs gateway select list
        let ipfsGatewaysList = ipfsGateways.getGatewaysList();
        Object.keys(ipfsGatewaysList).forEach(function(key, index) {
            addGatewayToSelectbox('ipfsGateways', ipfsGatewaysList[key]);
        });

        // ipfs settings
        switch (ipfsGateways.option) {
            case 'random':
                document.forms['settingsForm'].gateway[0].checked = true;
                break;
            case 'force_gateway':
                document.forms['settingsForm'].gateway[1].checked = true;
                document.getElementById('ipfsGateways').disabled = false;
                break;
            case 'other_gateway':
                document.forms['settingsForm'].gateway[2].checked = true;
                document.getElementById('ipfsOtherGateway').disabled = false;
                document.getElementById('ipfsOtherGateway').value =
                    ipfsGateways.currentGateway.address;
        }

        let IpfsSelectbox = document.getElementById('ipfsGateways');
        if (ipfsGateways.option != 'other') {
            IpfsSelectbox.value = ipfsGateways.currentGateway.key;
        } else 
            IpfsSelectbox.value = select[0].id; //we show first value to keep box non-empty

        setCurrentIPFSGateway(ipfsGateways);

        // shortcuts
        document.getElementById('shortcutBarInput').value =
            settings.shortcuts.addressbar;
        document.getElementById('shortcutSettingsInput').value =
            settings.shortcuts.settings;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getSettings = promisify(browser.storage.local, 'get', ['settings']);
    getSettings.then(loadCurrentSettings, onError);
}

function setCurrentIPFSGateway() {
    if (ipfsGateways.option != 'other') 
        currentGateway = ipfsGateways.currentGateway.name + ': ' + ipfsGateways.currentGateway.key;
    else //for 'other' the key and name both set to 'other', so we use 'adddres'
        currentGateway = gatewasetCurrentIPFSGatewayys.currentGateway.name + ': ' + gatewaysetCurrentIPFSGateway.currentGateway.address;
    document.getElementById('current_gateway').textContent = currentGateway;
}

function restoreDefaultGateways(e) {
    ipfsGateways.restoreToDeafult();

    // clear select input
    let select = document.getElementById('ipfsGateways');
    let length = select.options.length;
    for (i = 0; i < length; i++) {
        select.options[i] = null;
    }

    // add gateway to select input
    let ipfsGatewaysList = ipfsGateways.getGatewaysList();
    Object.keys(ipfsGatewaysList).forEach(function(key, index) {
        addGatewayToSelectbox('ipfsGateways', ipfsGatewaysList[key]);
    });

    msgAlert('Default IPFS gateways list restored', 1000);
}

/**
 * [saveSettings function will write user preferences into local storage]
 * @param  {[Object]} e [Event handler]
 */
function saveSettings(e) {
    e.preventDefault();

    // collect settings data
    let metricsPermission = document.querySelector('#metricCheckbox').checked;

    let ethereum =
        document.forms['settingsForm'].ethereum.value !== 'other'
            ? document.forms['settingsForm'].ethereum.value
            : document.getElementById('urlInput').value;

    switch (document.forms['settingsForm'].ipfs.value) {
        case 'ipfsRandom':
            ipfsGateways.setGatewayOptions('RANDOM');
            break;
        case 'ipfsForce':
            let key = document.getElementById('ipfsGateways').value;
            ipfsGateways.setGatewayOptions('FORCE', key);

            // update view
            document.getElementById('ipfsOtherGateway').value = '';
            setCurrentIPFSGateway(); 
            break;
        case 'ipfsOther':
            let other = document.getElementById('ipfsOtherGateway').key;
            ipfsGateways.setGatewayOptions('OTHER', other);
            select.value = select[0].id; //not to have gateway select box empty
            setCurrentIPFSGateway(); 
    }

    let AutoGatewaysUpdate = document.querySelector(
        '#autoGatewaysUpdateCheckbox'
    ).checked;

    let shortcuts = {
        addressbar: document.getElementById('shortcutBarInput').value,
        settings: document.getElementById('shortcutSettingsInput').value
    };

    // create, save and send 'reloadSettings' settings
    let settings = {
        metricsPermission: metricsPermission,
        autoGatewaysUpdate: AutoGatewaysUpdate,
        ethereum: ethereum,
        ipfsGateways: ipfsGateways,
        shortcuts: shortcuts
    };
    promisify(browser.storage.local, 'set', [{ settings }]);

    promisify(browser.runtime, 'sendMessage', [
        {
            reloadSettings: true
        }
    ]);

    msgAlert('Settings saved', 1000);
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
    .getElementById('restoreDefaultGatewaysButton')
    .addEventListener('click', e => restoreDefaultGateways(e));

// Radio group listeners
/**
 * [radioGroupListener, to catch radio group interactions from the page in hacky way]
 * @param  {[Object]} e [Event handler]
 */
function radioGroupListener(e) {
    if (e.target.getAttribute('name') === 'ethereum') {
        document.getElementById('urlInput').disabled =
            e.target.value !== 'other';
    } else if (e.target.getAttribute('name') === 'ipfs') {
        document.getElementById('ipfsGateways').disabled =
            e.target.value !== 'ipfsForce';

        document.getElementById('ipfsOtherGateway').disabled =
            e.target.value !== 'ipfsOther';
    }
}

document.addEventListener('click', radioGroupListener);

/**
 * [openGatewayModal will populate current elements of gateway into the modal gateway list
 *  will assign event handlers for action buttons, will make modal visible later ]
 * @param  {[Object]} e [Event handler]
 * @param  {string} gw [gateways object]
 * @param  {string} gwtype [gateway type, e.g., 'ipfs', 'ethereum' etc.]
 */
function openGatewayModal(e, gws, gwType) {
    const   listenerCollector = [];

    const   gatewayModal = document.getElementById('gatewayModal');
    const   modalGatewaysList = document.getElementById('modalGatewaysList');

    const   gatewaysSelect = document.getElementById(gwType + 'Gateways');

    const   type = gwType;
    const   gatewaysListHTMLElement = document.getElementById(gwType + 'Gateways');

    showGatewayModal();

    function showGatewayModal() {
        let  typeGatewaysList = gws.getGatewaysList();

        Object.keys(typeGatewaysList).forEach(function(gate, i) {
            const gatewayLI = document.createElement('li');
            const gatewayTextSpan = document.createElement('span');
            const gatewayEditButtonSpan = document.createElement('span');
            const gatewayRemoveButtonSpan = document.createElement('span');
            gatewayTextSpan.appendChild(
                document.createTextNode(typeGatewaysList[gate].name + ': ' + typeGatewaysList[gate].key)
            );
            gatewayEditButtonSpan.appendChild(document.createTextNode('Edit'));
            gatewayRemoveButtonSpan.appendChild(document.createTextNode('Remove'));
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
                createGatewayForm.bind(null, gatewayJSON, gws, gwType, 'Edit', editGateway)
            );

            listenerCollector[i * 2] = {
                element: gatewayEditButtonSpan,
                evtFunc: createGatewayForm.bind(null, gatewayJSON, gws, gwType, 'Edit', editGateway)
            };

            // Remove buttons
            gatewayRemoveButtonSpan.addEventListener(
                'click',
                removeGateway.bind(null, modalGatewaysList.children[i], gatewayJSON, gws, gwType)
            );

            listenerCollector[i * 2 + 1] = {
                element: gatewayRemoveButtonSpan,
                evtFunc: removeGateway.bind(null, modalGatewaysList.children[i], gatewayJSON, gws, gwType)
            };
        });

        // Save button (In edit and add input box)
        addGatewayButton = document.getElementById('addGatewayButton');
        addGatewayButton.addEventListener(
            'click',
            createGatewayForm.bind(null, null, gws, gwType, 'Save', addGateway)
        );

        listenerCollector[listenerCollector.length] = {
            element: addGatewayButton,
            evtFunc: createGatewayForm.bind(null, null, gws, gwType, 'Save', addGateway) 
        }

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
    function addGateway(e, gws, gwType) {
        e.stopPropagation();
        let name = document.getElementById('name_of_gateway').value;
        let key = document.getElementById('URL_of_gateway').value;
        let address = 'https://' + key;

        if (name == '' || key == '') 
            alert('Name and url can not be empty!');
        else if (gws.isGatewayInList(key))
            alert('Gateway with this url already exists!');
        else {

            let gateway = gws.addCustom(key, name, address);
            addGatewayToSelectbox(gwType + 'Gateways', gateway); 

            hideGatewayModal();
            showGatewayModal();
        }
    }

    /**
     * [editGateway will modify a gateway when user clicks edit action button in modal]
     * @param  {[Object]}   item    [Gateway object]
     */
    function editGateway(e, item, gws, gwType) {


        if (currentGateway == item.name + ': ' + item.value)
            alert("Can't edit current gateway");
        else if (gws.isGatewayInList(item.value))
            alert('Gateway with this url already exists!');
        else if (item.name == '' || item.key == '') {
            alert('Name and url can not be empty!');
        } else {
            //remove gateway's old version
            let gatewaysSelect = document.getElementById(gwType + 'Gateways');
            let gatewayToRemove = document.getElementById(item.key);
            gatewaysSelect.removeChild(gatewayToRemove);
            gws.removeGateway(item.key);

            //add gateway new version
            let name = document.getElementById('name_of_gateway').value;
            let key = document.getElementById('URL_of_gateway').value;
            let address = 'https://' + key;

            let gateway = gws.modifyGateway(key, name, address);
            
            addGatewayToSelectbox(gwType + 'Gateways', gateway);

            hideGatewayModal();
            showGatewayModal();
        }
    }
}

document
    .getElementById('manageGatewaysButton')
    .addEventListener('click', e=> openGatewayModal(e, ipfsGateways, 'ipfs'));

/**
 * [createGatewayForm will create add or edit form
 *  whenever user clicks add/edit action buttons in modal]
 * @param  {[Object]}       item (Optional)     [Gateway object]
 * @param  {[String]}       btnName             [Form submit button name/text]
 * @param  {[Object]}       e                   [Event handler]
 */
function createGatewayForm(item, gws, gwType, btnName, callback, e) {
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
        saveGatewayURLButton.addEventListener('click', e => callback(e, item,  gws, gwType));
    else 
        saveGatewayURLButton.addEventListener('click', e => callback(e, gws, gwType));
    addGatewayNameInput.focus();
}

/**
 * [removeGateway will remove gateway when user clicks remove action button in modal]
 * @param  {[Object]}   item    [Gateway object]
 */
function removeGateway(child, item, gws, gwType, e) {
    e.stopPropagation();

    if (modalGatewaysList.children.length == 1)
        alert("Can't remove gateway, list must include at least one gateway.");
    else if (currentGateway == item.name + ': ' + item.key)
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

        let gatewaysSelect = document.getElementById(gwType + 'Gateways');
        gatewaysSelect.removeChild(gatewayToRemove);

        //if a default key, add to removed gateways list
        gws.removeGateway(item.key);
    }
}

function addGatewayToSelectbox(selectboxID, gateway) {
    let option = document.createElement('option');
    let gateways = document.getElementById(selectboxID);
    option.text = gateway.name + ': ' + gateway.key;
    option.value = gateway.key;
    option.id = gateway.key;
    gateways.add(option);
}

/***** Auxillary Functions *****/

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
