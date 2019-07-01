# installation
Run a local parity node: `parity --light --jsonrpc-cors all`

npm install
node index.js

# bugs
change "almonit.eth" (which uses hex content) to "neiman33.eth" (which uses ipfs://.... content) and see the error.

# another bug
This uses web3.js ENS function. There are instructions [here](https://www.npmjs.com/package/ethereum-ens) for the ENS JS library "maintained by the ENS developers". However, I can't manage toget the example there work.
