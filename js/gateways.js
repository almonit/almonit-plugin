// gateways manage module

class Gateways {

	/**
	 * Constructor
	 */
	constructor() {
		this.deafult = {};
		this.custom = {};
		this.removed = {};

		this.gatewayOptions = Object({
			RANDOM: 'random',
			FORCE: 'force_gateway',
			OTHER: 'other_gateway'
		});
		
		this.option = this.gatewayOptions['RANDOM'];
		this.forcedGatway = null;
		this.currentGateway = null;

	}	

	// overrides value if key already exists
	addDefault(key, name, addres) {
		this.deafult[key] = {};
		this.deafult[key]["name"] = name;
		this.deafult[key]["address"] = address;
	}

	removeDefault(key) {
		if (key in this.default)
			delete this.default[key];
		else
			reportError("key is not in default list");			
	}

	/**
	 * Set the default list to the parameter, complete overrides old data
	 * @param {object} gatewaysList object of gateways 
	 */
	setDefaultGateways(gatewaysList) {
		this.default = gatewaysList;
	}

	addCustom(key, name, address) {
		this.custom[key] = {};
		this.custom[key]["name"] = name;
		this.custom[key]["address"] = address;
	}

	removeCustom(key) {
		if (key in this.custom)
			delete this.custom[key];
		else
			throw "The gateway does not exist in custom list.";				
	}

	setCustomGateways(gatewaysList) {
		this.custom = gatewaysList;	
	}

	/**
	 * [handles the remove process of a gateway]
	 * @param  {[type]} key [description]
	 * @return {[type]}     [description]
	 */
	removeGateway(key) {
		//if a default key, add to removed gateways list
        if (key in this.default) 
            this.removed[key] = true;
        if (key in this.custom)
            delete this.custom[key];
	}

	setRemovedGateways(gatewaysList) {
		this.removed = gatewaysList;			
	}

	getRandom() {
		let fullGatewayList = getGatewaysList();

		let keys = Object.keys(fullGatewayList);
		let ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];

		this.currentGateway = fullGatewayList[ipfsGatewayKey];
	}

	/**
	 * Set Gateway Options
	 * @param {string} option
	 * @param {string} gateway optional for OTHER or FORCE options, must be of gateway structure
	 */
	setGatewayOptions(option, gateway = null) {
		if (option in this.gatewayOptions) {
			switch (option) {
				case "RANDOM":
					this.option = this.gatewayOptions[option];
					break;
				case "FORCE":
					if (gateway !== null) {//TODO: check if gateway in list!
						this.currentGateway = gateway; 
						this.option = this.gatewayOptions[option];
					}
					else
						throw "specify 'gateway' with 'FORCE' option."; 
				case "OTHER":
					if (gateway !== null) {
						this.currentGateway = gateway; 
						this.option = this.gatewayOptions[option];	
					}
					else
						throw "specify 'gateway' with 'OTHER' option."; 
			}
		} else
			throw "Option is invalid."
	}

	setCurrentGateway(keyOrGateway) {
		if (keyOrGateway in this.custom) 
			this.currentGateway = this.custom[keyOrGateway];
		else if ( (keyOrGateway in this.default) && !(keyOrGateway in this.removed) ) 
			this.currentGateway =  this.default[keyOrGateway];
		else if (this.option == this.gatewayOptions['OTHER'])
			this.currentGateway =  keyOrGateway;
		else
			throw "Error: bad function parameter";
	}

	getCurrentgateway() {
		return this.currentGateway;
	}

	getGatewaysList() {
		let fullGatewaysList = {};

		for (let gateway in this.default) {
        fullGatewaysList[gateway] = this.default[gateway];
	    }

	    // delete removed gateways
	    for (let gateway in this.resmoved) {
	        delete fullGatewaysList[gateway];
	    }

	    // add "added gateways"
	    for (let gateway in this.custom) {
	        fullGatewaysList[gateway] = this.custom[gateway];
	    }	
	}

}


function reportError(e) {
	console.log("error: ", e);
}