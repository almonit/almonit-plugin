# almonit_plugin
ENS+IPFS Firefox plugin by Almonit

# installation
In Firefox, enter `about:debugging`.

Choose `Load Temporary Add-on...`

From the folder of the plugin, choose `manifest.json`

# usage
Navigate to ENS+IPFS websites such as:
- almonit.eth
- pepesza.eth
- portalnetwork.eth
- monkybrain.eth

## enable metrics
The plugin asks permission for taking privacy preserving metrics when it's first activated. If permission is given, metrics are sent every `reportThreshold` times, (parameter is set in `js/metrics.js`). 

The metrics will be sent to our server in production version. Right now a local node.js server needs to be run to test it:

- cd socket.io-server
- npm build
- npm start

# TODO
Quite a lot!

- plugin popup (after pressing plugin button in firefox bar)
- custom error page (referring to ENS+IPFS websites index/search)
- Decentralization via randomality: the plugin will choose each time a random IPFS gateway (that's a way of avoiding everyone using the same IPFS gateway, which is centrazliation)
- redesign ugly theme
- improve new ENS address bar
- remove classic address bar in ENS websites

