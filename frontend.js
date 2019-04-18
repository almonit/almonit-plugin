document.body.innerHTML = '<div style="padding: 1px 16px; background: #555; color: #f1f1f1;" id="myHeader"> <input type="text" id="ENS_url" value=""> </div>' + document.body.innerHTML;

//document.body.innerHTML = '<script> window.onscroll = function() {myFunction()}; var header = document.getElementById("myHeader"); var sticky = header.offsetTop; function myFunction() { if (window.pageYOffset > sticky) { header.classList.add("sticky"); } else { header.classList.remove("sticky"); } } </script>' + document.body.innerHTML;

function setENSurl(message) {
	document.getElementById("ENS_url").value = message.response;	
}

function handleError(error) {
  console.log(`Error: ${error}`);
}

function sendmsg() {
	var url = window.location.href;
	var ipfs_location = url.lastIndexOf("ipfs");
	var ipfsaddress = url.substring(ipfs_location+5,url.length-1); //TODO: remove constants
  var sending = browser.runtime.sendMessage({
      greeting: ipfsaddress
    });
sending.then(setENSurl, handleError);  
}

sendmsg();  

window.onblur = setOriginalTheme;
window.onfocus = setAlmonitTheme;

function setAlmonitTheme() {
  var sending = browser.runtime.sendMessage({
      greeting: "set_almonit_theme"
    });
}

function setOriginalTheme() {
	console.log("setting original theme");
  var sending = browser.runtime.sendMessage({
      greeting: "set_original_theme"
    });
}
