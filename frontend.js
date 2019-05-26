// load settings
var get_settings = browser.storage.local.get('settings');
get_settings.then(restoreCurrentSettings, onError);

// init shortcuts
var shortcutAddressBar = "";
var shortcutSettings = "";

function restoreCurrentSettings(result) {
    settings = result.settings;

    shortcutAddressBar = settings.shortcuts.addressbar;
    shortcutSettings = settings.shortcuts.settings;
}
const lionIcon = browser.runtime.getURL('theme/lion_header.png');
document.body.innerHTML =
    `
    <div>
        <div class="group group-new">
        <div id="dragContainer" class="rect2"></div>
            <div id="drag" class="rect almonit-bar">
                <div class="almonit-bar__content">
                    <img id="expandBar" src="${lionIcon}"/>
                </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0" height="0">
                <defs>
                    <filter id="fancy-goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
                        <feColorMatrix 
                          in="blur" 
                          mode="matrix" 
                          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -11" 
                          result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                    </filter>
                </defs>
            </svg>
        </div>
        <input type="text" id="ENS_url" class="urlbar" value="" autofocus>
    </div>
    ` + document.body.innerHTML;

initListener();

/**
 * [initListener - itializes all listeners and restore functions]
 */
function initListener() {
    const dragElm = document.getElementById('drag');
    const expandBarElm = document.getElementById('expandBar');
    const urlBar = document.getElementById('ENS_url');

    shortcutEvents(expandBarElm, urlBar);
    restoreDragPosition(dragElm, urlBar);

    dragElement(dragElm);
    expandBarElm.addEventListener(
        'click',
        function(e) {
            const targetClass = e.target.parentNode.parentNode.classList;
            if (targetClass.contains('noclick')) {
                targetClass.remove('noclick');
            } else {
                targetClass.toggle('active');
                if (!targetClass.contains('active')) {
                    urlBar.style.display = 'none';
                }
            }
        },
        false
    );

    dragElm.addEventListener('transitionend', function(e) {
        const targetClass = e.target.classList;
        urlBar.style.display = targetClass.contains('active') && 'inherit';
    });
}

/**
 * [shortcutEvents - binds keyup event for address bar]
 * @param  {[DOM]} elm    [Address Bar DOM]
 * @param  {[DOM]} urlBar [Address input DOM]
 */
function shortcutEvents(elm, urlBar) {
    document.onkeydown = function(e) {
        // create a string representing the keys which were pressed
        var keyStr = ["Control", "Shift", "Alt", "Meta"].includes(e.key) ? "" : e.key;
        var shortcutStr   =
            ( e.ctrlKey  ? "Ctrl+" : "" ) +
            ( e.shiftKey ? "Shift+"   : "" ) +
            ( e.altKey   ? "Alt+"     : "" ) +
            ( e.metaKey  ? "Meta+"    : "" ) +
            keyStr;

        if (shortcutStr == shortcutAddressBar) {
            console.info('Address bar toggled.');
            const targetClass = elm.parentNode.parentNode.classList;
            if (targetClass.contains('noclick')) {
                targetClass.remove('noclick');
            } else {
                targetClass.toggle('active');
                if (!targetClass.contains('active')) {
                    urlBar.style.display = 'none';
                } else {
                    setTimeout(() => {
                        urlBar.focus();
                        urlBar.select();
                    }, 500);
                }
            }
        } else if (shortcutStr == shortcutSettings) {
            browser.runtime.sendMessage({
                settings: true
            });
        }
    };
}

/**
 * [restoreDragPosition - reads last position of address bar to keep it's position persistent]
 * @param  {[DOM]}  elm    [Address Bar DOM]
 * @param  {[DOM]}  urlBar [Address input DOM]
 */
function restoreDragPosition(elm, urlBar) {
    const storageItem = localStorage.getItem('almonit__bar');
    if (storageItem) {
        const res = JSON.parse(storageItem);
        elm.style.top = res.y;
        elm.style.left = res.x;
        if (res.active) {
            elm.classList.add('active');
            urlBar.style.display = 'inherit';
            urlBar.style.top = parseFloat(res.y, 10) + 10 + 'px';
            urlBar.style.left = parseFloat(res.x, 10) + 60 + 'px';
        }
    }
}

/**
 * [dragElement - binds Drag & Drop events for the address bar]
 * @param  {[DOM]}  elm    [Address Bar DOM]
 */
function dragElement(elm) {
    const urlBar = document.getElementById('ENS_url');

    const DRAG_RESISTANCE = 3;
    const STICKY_RESISTANCE = 30;
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elm.id)) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elm.id).onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elm.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        //this will prevent triggering click while dragging

        if (
            !elm.classList.contains('noclick') &&
            (Math.abs(pos3 - e.clientX) > DRAG_RESISTANCE ||
                Math.abs(pos4 - e.clientY) > DRAG_RESISTANCE)
        ) {
            elm.classList.add('noclick');
        }

        if (
            e.clientX > STICKY_RESISTANCE &&
            e.clientX < window.innerWidth - STICKY_RESISTANCE
        ) {
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos3 = e.clientX;
        }

        if (
            e.clientY > STICKY_RESISTANCE &&
            e.clientY < window.innerHeight - STICKY_RESISTANCE
        ) {
            pos2 = pos4 - e.clientY;
            pos4 = e.clientY;
        }

        let top = elm.offsetTop - pos2;
        let topLimit =
            top >= 0
                ? top + elm.offsetHeight <= window.innerHeight
                    ? top
                    : window.innerHeight - elm.offsetHeight
                : 0;

        let left = elm.offsetLeft - pos1;
        let leftLimit =
            left >= 0
                ? left + elm.offsetWidth <= window.innerWidth
                    ? left
                    : window.innerWidth - elm.offsetWidth
                : 0;

        let topPx = lerp(topLimit, e.clientY, 0.001);
        let leftPx = lerp(leftLimit, e.clientX, 0.001);
        // set the element's new position:
        elm.style.top = topPx + 'px';
        elm.style.left = leftPx + 'px';

        urlBar.style.top = topPx + 10 + 'px';
        urlBar.style.left = leftPx + 60 + 'px';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

/**
 * [lerp - Linear interpolation function]
 * @param  {[Float]}    start   [Starting point]
 * @param  {[Float]}    end     [Ending point]
 * @param  {[Float]}    amt     [Interval]
 * @return {[Float]}            [Interpolation]
 */
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * [setENSurl - sets ens url on address bar]
 * @param {[Object]} message [Callback data from ipfs function]
 */
function setENSurl(message) {
   	const urlBar = document.getElementById('ENS_url');
    urlBar.value = message.response;

    urlBar.addEventListener('keyup', function(event) {
        if (event.keyCode == 13) {
            const dragElm = document.getElementById('drag');
            localStorage.setItem(
                'almonit__bar',
                JSON.stringify({
                    x: dragElm.style.left,
                    y: dragElm.style.top,
                    active: dragElm.classList.contains('active')
                })
            );

            let url = document.getElementById('ENS_url').value;
            browser.runtime
                .sendMessage({
                    normalizeURL: url
                })
                .then(
                    data => window.location.replace(data.response),
                    onError
                );
        }
    });
}

/**
 * [onError - error callback]
 * @param  {[Object]} error [error callback data]
 */
function onError(error) {
    console.log(`Error: ${error}`);
}

/**
 * [sendmsg - sends given url to the browsers address bar to resolve its' ipfs address]
 * @return {[type]} [description]
 */
function sendmsg() {
    const url = window.location.href;
    let ipfs_location = url.lastIndexOf('ipfs');
    let ipfsaddress = url.substring(ipfs_location + 5, url.length - 1); //TODO: remove constants
    let sending = browser.runtime.sendMessage({
        ipfsAddress: ipfsaddress
    });
    sending.then(setENSurl, handleError);
}

sendmsg();
