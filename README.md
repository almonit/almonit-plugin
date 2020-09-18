# Almonit plugin
A Dwebsites (decentralized websites) browser extension by Almonit

# Description
Almonit is a browser extension for Dwebsites.

Traditional websites use a server and a name service (DNS) to be accessible. Decentralized websites replace the server with a decentralized storage, and the name service with a decentralized name service.

Almonit browser extension let users access Dwebsites through the browser. The extension focuses on IPFS and Skynet as a decentralized storage, and ENS as a decentralized name service. 

For more information read our [introduction to Dwebsites](http://blog.almonit.eth/Introduction_to_Dwebsitse.html) article. The [how it works](#how-it-works) section in this README gives a more technical description.

# Installation 
## From source code

### Compile
Make sure you have nvm installed with node v10.14.2 available. Then enter the following commands.

```
nvm use v10.14.2
cd js/web3-wrapper
npm install
npm run build
```


### Firefox installation (after compilation)
In Firefox, enter `about:debugging`.

Choose `Load Temporary Add-on...`

From the folder of the plugin, choose `manifest.json`

#### Chrome installation (after compilation)
See instructions [here](https://thoughtbot.com/blog/how-to-make-a-chrome-extension#load-your-extension-into-chrome).

## Installation from extension store

- Firefox: https://addons.mozilla.org/en-GB/firefox/addon/almonit/
- Chrome, Opera, Brave: https://chrome.google.com/webstore/detail/almonit/adobfkcnfkodjfobnndpfipdanhdcafm
- Edge: https://giphy.com/gifs/jk-just-kidding-messin-3ohhwpVt8pe3Kdm5nW/fullscreen

# Usage
Navigate to ENS+IPFS and ENS+Skynet websites such as:
- http://almonit.eth
- http://dxdao.eth
- http://skypages.dwbst.eth

See full list in the [Almonit Search Engine](http://almonit.eth/).


# How it works
The core functionality of the plugin is to forward .eth addresses to IPFS or Skynet addresses (depends on what the owner of the .eth address set). It works as follows.

- When an .eth address is entered in the address bar, the plugin uses webRequest and webRequestBlocking to block the request, and process it itself.
- The plugin uses web3.js the check the ENS record in Ethereum blockchain. At the moment,t he plugin checks in two main ENS resolvers: the [default one](https://etherscan.io/address/0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41) and an [older ersion](https://etherscan.io/address/0x1da022710dF5002339274AaDEe8D58218e9D6AB5) (for legacy).
- The plugin processes the content of the ENS record that web3.js returns, and checks if it has an IPFS contenthash, or a 'skynet' key.
- If the content is an IPFS address, the plugin redirects the browser to the IPFS page. If there a 'skynet' key, it redirects to to a Skynet page. If the .eth name has both set, then the IPFS page will be chosen.  
-  By default, the redirection is to a random IPFS or Skynet gateway (we call it, *decentralization via randomization*). In the settings users can modify the IPFS gateways list, force a specific gateway, or choose to use their own local IPFS node.

The plugin contains some extra features, such as a popup window that helps the user discover decentralized websites. See [#features](features) for full details.

# Features
- Plugin popup: helps you explore ENS+IPFS websites
- Decentralization via randomality: the plugin chooses each time a random IPFS and Skynet gateways (that's a way of avoiding everyone using the same gateway all the time, and hence indirectly cause centralization).
- Settings page offers (almost) full customization.
- Anonymous update of IPFS and Skynet gatewys list. The update is being done via [update.extension.almonit.eth](https://update.extension.almonit.eth). This way users get updates in an anonymous way without directly communicating with us.

# Contact
Write us at contact@almonit.club or via [our Twitter](https://twitter.com/GoAlmonit).
