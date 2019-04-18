var Web3 = require('web3');

const web3 = new Web3("https://mainnet.infura.io/v3/4ff76c15e5584ee4ad4d0c248ec86e17");
//const web3 = new Web3("http://localhost:8545");

module.exports = {
  getContenthash: function (name) {
		return web3.eth.ens.getContenthash(name);
  },

	getContent: function (name) {
		return web3.eth.ens.getContent(name);
	}	
};
