# Almonit plugin
A decentralized websites plugin by Almonit

# Description
Almonit is a plugin to access decentralized websites.

Traditional websites use a server and a name service (DNS) to be accessible. Decentralized websites replace the server with decentralized storage, and the name service with a decentralized name service.

Almonit plugin let users access decentralized websites through the browser. The plugin focuses on IPFS as a decentralized storage, and ENS as a decentralized name service. 

See more information on ENS+IPFS websites [in our blog](http://almonit.club/blog/ens+ipfs/ENSIPFS-Part-1-Introduction.html). The [how it works](#how-it-works) section in this README gives a more technical description.

# Installation
In Firefox, enter `about:debugging`.

Choose `Load Temporary Add-on...`

From the folder of the plugin, choose `manifest.json`

# Usage
Navigate to ENS+IPFS websites such as:
- almonit.eth
- pepesza.eth
- portalnetwork.eth
- monkybrain.eth

See full list in the [Almonit Dweb Portal](http://almonit.club/).

## Enable metrics
The plugin asks permission for taking privacy preserving metrics when it's first activated. If permission is given, metrics are sent every `reportThreshold` times, (parameter is set in `js/metrics.js`). 

The metrics will be sent to our server in production version. Right now a local node.js server needs to be run to test it:

- cd socket.io-server
- npm build
- npm start


# How it works
The core functionality of the plugin is to forward .eth addresses to IPFS addresses. It works as follows.

- When an .eth address is entered in the address bar, the plugin uses webRequest and webRequestBlocking to block the request, and process it itself.
- The plugin uses web3.js the check the ENS record in Ethereum blockchain. At the moment, the plugin checks in two main ENS resolvers: the [default one](https://etherscan.io/address/0xD3ddcCDD3b25A8a7423B5bEe360a42146eb4Baf3) and the [previous one](https://etherscan.io/address/0x1da022710dF5002339274AaDEe8D58218e9D6AB5) (for legacy).
- The plugin processes the content of the ENS record that web3.js returns, and checks if its an IPFS address.
- If the content is an IPFS address, the plugin redirects the browser to the IPFS page.  By default, the redirection is to a random IPFS gateway (we call it, *decentralization via randomization*). In the settings users can modify the IPFS gateways list, force a specific gateway, or choose to use their own local IPFS node.

The plugin contains some extra features, such as a popup window that helps the user discover decentralized websites, and an additional address bar for decentralized websites. See [#features](features) for full details.

# Features
- Plugin popup: helps you explore ENS+IPFS wbsites
- Decentralization via randomality: the plugin chooses each time a random IPFS gateway (that's a way of avoiding everyone using the same IPFS gateway, which is centrazliation).
- ENS address bar: allows you to navigate the ENS+IPFS ecosphere.
- Settings page offers (almost) full customization.

# Limitation
At this stage the plugin is only for Firefox. The development focused on desktop browsers, though the plugin should also work on mobile devices.

A Chrome version is planned in the future.

# Contact
Write us at contact@almonit.club
