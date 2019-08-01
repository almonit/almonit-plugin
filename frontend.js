// load settings
var getSettings = promisify(browser.storage.local, 'get', ['settings']);
getSettings.then(restoreCurrentSettings, onError);

// init shortcuts
var shortcutAddressBar = '';
var shortcutSettings = '';

function restoreCurrentSettings(result) {
    settings = result.settings;

    shortcutAddressBar = settings.shortcuts.addressbar;
    shortcutSettings = settings.shortcuts.settings;
}

const lionIcon = browser.runtime.getURL('resources/lion_header.png');
const addressBarTemplate = `
    <div id="almonit_ENS_url_div" hidden=true>
        <div class="almonit-group">
            <div class="almonit-rect2"></div>
            <div id="almonit_drag" class="almonit-rect almonit-bar">
                <div class="almonit-bar__content">
                    <img id="almonit_expandBar" src="${lionIcon}"/>
                </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0" height="0">
                <defs>
                    <filter id="almonit-gooey">
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
        <input type="text" id="almonit_ENS_url" class="almonit-urlbar" value="" autofocus>
    </div>
    `;
var domparser = new DOMParser();
const mimeType = 'text/html';
const addressBarDOM = domparser.parseFromString(addressBarTemplate, mimeType);
document.body.insertBefore(
    addressBarDOM.body.firstChild,
    document.body.firstChild
);

initListener();

/**
 * [initListener - itializes all listeners and restore functions]
 */
function initListener() {
    const dragElm = document.getElementById('almonit_drag');
    const expandBarElm = document.getElementById('almonit_expandBar');
    const urlBar = document.getElementById('almonit_ENS_url');

    shortcutEvents(expandBarElm, urlBar);
    dragElement(dragElm);

    expandBarElm.addEventListener(
        'click',
        function(e) {
            const targetClass = e.target.parentNode.parentNode.classList;
            if (targetClass.contains('noclick')) {
                targetClass.remove('noclick');
            } else {
                targetClass.toggle('almonit-active');
                if (!targetClass.contains('almonit-active')) {
                    urlBar.style.setProperty('display', 'none', 'important');
                }
                saveUrlBarLocation();
            }
        },
        false
    );

    dragElm.addEventListener('transitionend', function(e) {
        const targetClass = e.target.classList;

        const leftPx = parseFloat(e.target.style.left);
        const topPx = parseFloat(e.target.style.top);

        if (
            leftPx > window.innerWidth / 2 &&
            window.innerWidth > 1030 //HARDCODE
        ) {
            if (
                dragElm.style.transform === '' ||
                dragElm.style.transform === 'none'
            ) {
                reverseBar(dragElm, expandBarElm);
            }

            urlBar.style.setProperty('top', topPx + 10 + 'px');
            urlBar.style.setProperty(
                'left',
                leftPx - urlBar.offsetWidth + 'px'
            );
        } else {
            urlBar.style.setProperty('top', parseFloat(topPx, 10) + 10 + 'px');
            urlBar.style.setProperty(
                'left',
                parseFloat(leftPx, 10) + 60 + 'px'
            );
        }

        urlBar.style.setProperty(
            'display',
            targetClass.contains('almonit-active') ? 'block' : '',
            'important'
        );
    });

    window.onresize = function() {
        if (window.innerHeight <= parseFloat(dragElm.style.top, 10) + 200) {
            dragElm.style.setProperty('top', window.innerHeight - 50 + 'px');
            urlBar.style.setProperty('top', window.innerHeight - 40 + 'px');
        }

        if (
            window.innerWidth <= parseFloat(dragElm.style.left, 10) + 515 &&
            window.innerWidth > 1030
        ) {
            dragElm.style.setProperty('left', window.innerWidth - 60 + 'px');
            urlBar.style.setProperty('left', window.innerWidth - 500 + 'px');
        }

        if (window.innerWidth < 1030) reverseBar(dragElm, expandBarElm, true);
    };

    restoreDragPosition(dragElm, urlBar);
}

/**
 * [shortcutEvents - binds keyup event for address bar]
 * @param  {[DOM]} elm    [Address Bar DOM]
 * @param  {[DOM]} urlBar [Address input DOM]
 */
function shortcutEvents(elm, urlBar) {
    document.onkeydown = function(e) {
        // create a string representing the keys which were pressed
        var keyStr = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)
            ? ''
            : e.key;
        var shortcutStr =
            (e.ctrlKey ? 'Ctrl+' : '') +
            (e.shiftKey ? 'Shift+' : '') +
            (e.altKey ? 'Alt+' : '') +
            (e.metaKey ? 'Meta+' : '') +
            keyStr;

        if (shortcutStr == shortcutAddressBar) {
            console.info('Address bar toggled.');
            const targetClass = elm.parentNode.parentNode.classList;
            if (targetClass.contains('noclick')) {
                targetClass.remove('noclick');
            } else {
                targetClass.toggle('almonit-active');
                if (!targetClass.contains('almonit-active')) {
                    urlBar.style.setProperty('display', 'none', 'important');
                } else {
                    setTimeout(() => {
                        urlBar.focus();
                        urlBar.select();
                    }, 500);
                }
            }
        } else if (shortcutStr == shortcutSettings) {
            promisify(browser.runtime, 'sendMessage', [
                {
                    settings: true
                }
            ]);
        }
    };
}

/**
 * [restoreDragPosition - reads last position of address bar to keep it's position persistent]
 * @param  {[DOM]}  elm    [Address Bar DOM]
 * @param  {[DOM]}  urlBar [Address input DOM]
 */
function restoreDragPosition(elm, urlBar) {
    const dragElm = document.getElementById('almonit_drag');
    const expandBarElm = document.getElementById('almonit_expandBar');
    promisify(browser.storage.local, 'get', ['almonitBar']).then(function(
        item
    ) {
        res = item.almonitBar;
        if (!!res && Object.keys(res).length > 0) {
            elm.style.setProperty('top', res.y);
            elm.style.setProperty('left', res.x);
            if (res.active) {
                if (res.isReverse) {
                    reverseBar(dragElm, expandBarElm);
                }
                setTimeout(() => elm.classList.add('almonit-active'), 500);
            }
        }
    });
}

/**
 * [dragElement - binds Drag & Drop events for the address bar]
 * @param  {[DOM]}  elm    [Address Bar DOM]
 */
function dragElement(elm) {
    const urlBar = document.getElementById('almonit_ENS_url');
    const expandBarElm = document.getElementById('almonit_expandBar');

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
                ? left +
                      (window.innerWidth > elm.offsetWidth * 2
                          ? 60 //HARDCODE
                          : elm.offsetWidth) <=
                  window.innerWidth
                    ? left
                    : window.innerWidth -
                      (window.innerWidth > elm.offsetWidth * 2
                          ? 60 //HARDCODE
                          : elm.offsetWidth)
                : 0;

        let topPx = lerp(topLimit, e.clientY, 0.001);
        let leftPx = lerp(leftLimit, e.clientX, 0.001);
        // set the element's new position:
        elm.style.setProperty('top', topPx + 'px');
        elm.style.setProperty('left', leftPx + 'px');

        if (
            leftPx > window.innerWidth / 2 &&
            window.innerWidth > 1030 //HARDCODE
        ) {
            reverseBar(elm, expandBarElm);
            urlBar.style.setProperty('top', topPx + 10 + 'px');
            urlBar.style.setProperty(
                'left',
                leftPx - urlBar.offsetWidth + 'px'
            );
        } else {
            reverseBar(elm, expandBarElm, true);
            urlBar.style.setProperty('top', topPx + 10 + 'px');
            urlBar.style.setProperty('left', leftPx + 60 + 'px');
        }
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;

        saveUrlBarLocation();
    }
}

/**
 * [saves into storage the location of the URL bar]
 * @return {[none]}
 */
function saveUrlBarLocation() {
    const dragElm = document.getElementById('almonit_drag');
    const leftPx = parseFloat(dragElm.style.left, 10);
    var almonitBar = {
        x: dragElm.style.left,
        y: dragElm.style.top,
        active: dragElm.classList.contains('almonit-active'),
        isReverse: leftPx > window.innerWidth / 2
    };
    promisify(browser.storage.local, 'set', [{ almonitBar }]);
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
    const urlBar = document.getElementById('almonit_ENS_url');
    urlBar.value = message.response;

    document.getElementById('almonit_ENS_url_div').hidden = false;

    urlBar.addEventListener('keyup', function(event) {
        if (event.keyCode == 13) {
            let url = document.getElementById('almonit_ENS_url').value;
            promisify(browser.runtime, 'sendMessage', [
                {
                    normalizeURL: url
                }
            ]).then(data => window.location.replace(data.response), onError);
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
    let ipfsLocation = url.lastIndexOf('ipfs');
    let ipfsAddress = url.substring(ipfsLocation + 5, url.length - 1); //TODO: remove constants
    let sending = promisify(browser.runtime, 'sendMessage', [
        {
            ipfsAddress: ipfsAddress
        }
    ]);
    sending.then(setENSurl, handleError);
}

function handleError(e) {
    console.log('error: ' + e);
}

sendmsg();

function reverseBar(dragElm, expandBarElm, revert = false) {
    if (revert) {
        dragElm.style.setProperty('transform', 'none', 'important');
        expandBarElm.style.setProperty('transform', 'none', 'important');
        dragElm.style.setProperty('transform-origin', 'initial', 'important');
        return;
    }

    dragElm.style.setProperty('transform', 'rotateY(-180deg)', 'important');
    expandBarElm.style.setProperty('transform', 'rotateY(180deg)', 'important');
    dragElm.style.setProperty('transform-origin', '30px', 'important');
}
