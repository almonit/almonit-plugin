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

function initListener() {
    const dragElm = document.getElementById('drag');
    const expandBarElm = document.getElementById('expandBar');
    const urlBar = document.getElementById('ENS_url');

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

function dragElement(elmnt) {
    const urlBar = document.getElementById('ENS_url');

    const DRAG_RESISTANCE = 3;
    const STICKY_RESISTANCE = 30;
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id)) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id).onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
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
            !elmnt.classList.contains('noclick') &&
            (Math.abs(pos3 - e.clientX) > DRAG_RESISTANCE ||
                Math.abs(pos4 - e.clientY) > DRAG_RESISTANCE)
        ) {
            elmnt.classList.add('noclick');
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

        let top = elmnt.offsetTop - pos2;
        let topLimit =
            top >= 0
                ? top + elmnt.offsetHeight <= window.innerHeight
                    ? top
                    : window.innerHeight - elmnt.offsetHeight
                : 0;

        let left = elmnt.offsetLeft - pos1;
        let leftLimit =
            left >= 0
                ? left + elmnt.offsetWidth <= window.innerWidth
                    ? left
                    : window.innerWidth - elmnt.offsetWidth
                : 0;

        let topPx = lerp(topLimit, e.clientY, 0.001);
        let leftPx = lerp(leftLimit, e.clientX, 0.001);
        // set the element's new position:
        elmnt.style.top = topPx + 'px';
        elmnt.style.left = leftPx + 'px';

        urlBar.style.top = topPx + 10 + 'px';
        urlBar.style.left = leftPx + 60 + 'px';
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

/*Linear interpolation*/
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

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
            //browser.runtime
            //	.sendMessage({
            //  	normalizeURL: url
            //	})
            // 	.then(
            //  		data => window.location.replace(data.response),
            //  		handleError
          	//	);
        }
    });
}

function handleError(error) {
    console.error(`Error: ${error}`);
}

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

window.onblur = setOriginalTheme;
window.onfocus = setAlmonitTheme;

function setAlmonitTheme() {
    let sending = browser.runtime.sendMessage({
    	theme: 'set_almonit_theme' 
    });
}

function setOriginalTheme() {
    console.info('setting original theme');
    let sending = browser.runtime.sendMessage({
    	theme: 'set_original_theme'
    });
}
