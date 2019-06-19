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

See full list in the [Almonit Dweb Portal](http://almonit.club/).

## enable metrics
The plugin asks permission for taking privacy preserving metrics when it's first activated. If permission is given, metrics are sent every `reportThreshold` times, (parameter is set in `js/metrics.js`). 

The metrics will be sent to our server in production version. Right now a local node.js server needs to be run to test it:

- cd socket.io-server
- npm build
- npm start

# Features
- Plugin popup: helps you explore ENS+IPFS wbsites
- Decentralization via randomality: the plugin chooses each time a random IPFS gateway (that's a way of avoiding everyone using the same IPFS gateway, which is centrazliation).
- ENS address bar: allows you to navigate the ENS+IPFS ecosphere.
- Settings page offers (almost) full customization.

# Contact
Write us at contact@almonit.club
