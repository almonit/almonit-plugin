var Web3 = require('web3');

var web3 = '';

//var web3 = new Web3("https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17");
//const web3 = new Web3("http://localhost:8545");

//web3.eth.ens.getContent("almonit.eth").then(function(add) {console.log(add);});


module.exports = {
	connect_web3: function(node) {
		if (web3 == '') web3 = new Web3(node);
	},

	getContenthash: function(name) {
		return web3.eth.ens.getContenthash(name);
	},

	getContent: function(name) {
		return web3.eth.ens.getContent(name);
	},

	getSkynet: function(name) {
		return web3.eth.ens.getText(name,"skynet");
    }
};
