// gateways manager module
class Gateways {

	/**
	 * Constructor
	 * @param  {Object} data [data for Gateways object]
	 */
	constructor(data = null) {
		this.gatewayOptions = Object({
			RANDOM: 'random',
			FORCE: 'force_gateway',
			OTHER: 'other_gateway'
		});

		this.default = {};
		this.custom = {};
		this.removed = {};
		
		this.option = this.gatewayOptions['RANDOM'];
		this.currentGateway = null;
		this.noNewRandomWhenSaving = false;

		if (data !== null)
			this.loadData(data);
	}

	/**
	 * loads data of Gatways objcet
	 * @param  {Object} data [data of Gatways object]
	 */
	loadData(data) {
		if (data.default) {this.setDefaultGateways(data.default);}
		if (data.custom) {this.setCustomGateways(data.custom);} 
		if (data.removed) {this.setRemovedGateways(data.removed);}

		if (data.option) {this.option = data.option;}
		if (data.currentGateway) {this.currentGateway = data.currentGateway;}
		if (!!data.noNewRandomWhenSaving) {this.noNewRandomWhenSaving = data.noNewRandomWhenSaving;}
	}	

	// overrides value if key already exists
	addDefault(key, name, address) {
		let gateway = {};

		gateway.key = key;
		gateway.name = name;
		gateway.address = address;

		this.default[key] = gateway;

		return gateway;
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
		if ( this.currentGateway && 
			 (this.currentGateway.key in this.default) &&
		     !(this.currentGateway.key in gatewaysList) ){
			this.default = gatewaysList;	
			this.option = this.gatewayOptions['RANDOM'];
			this.currentGateway = this.getRandom();
		}  else
			this.default = gatewaysList;
	}


	addCustom(key, name, address) {
		let gateway = {};

		gateway.key = key;
		gateway.name = name;
		gateway.address = address;

		this.custom[key] = gateway;
		
		return gateway;
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

	modifyGateway(key, name, address) {
		// remove from default list if gateway is there
         if (this.default[key])
             this.removed[key] = true;

        let gateway = {};
		gateway.key = key;
		gateway.name = name;
		gateway.address = address;

		this.custom[key] = gateway;

		return gateway;
	}

	getRandom() {
		let fullGatewayList = this.getGatewaysList();

		let keys = Object.keys(fullGatewayList);
		let ipfsGatewayKey = keys[(keys.length * Math.random()) << 0];

		return fullGatewayList[ipfsGatewayKey];
	}

	/**
	 * Set Gateway Options
	 * @param {string} option
	 * @param {string} gateway optional for OTHER or FORCE options, must be of gateway structure
	 */
	setGatewayOptions(option, gatewayKeyOrAddress = null) {
		if (option in this.gatewayOptions) {
			switch (option) {
				case "RANDOM":
					let oldOption = this.option;
					this.option = this.gatewayOptions[option];
					if (oldOption == this.gatewayOptions['OTHER'])
						this.currentGateway = this.getRandom();
					break;
				case "FORCE":
					if (gatewayKeyOrAddress !== null) {
						let gatewasyList = this.getGatewaysList();
						if (gatewayKeyOrAddress in gatewasyList) {
							this.currentGateway = gatewasyList[gatewayKeyOrAddress]; 
							this.option = this.gatewayOptions[option];
						} else
							throw "gatewayKeyOrAddress is not in Gateways list"
					}
					else
						throw "specify 'gateway' with 'FORCE' option."; 
					break;
				case "OTHER":
					if (gatewayKeyOrAddress !== null) {
						let otherGateyway = {};
						otherGateyway.key = "other";
						otherGateyway.name = "other";
						otherGateyway.address = gatewayKeyOrAddress;

						this.currentGateway = otherGateyway; 
						this.option = this.gatewayOptions[option];	
					}
					else
						throw "specify 'gateway' with 'OTHER' option."; 
			}
		} else
			throw "Option is invalid."
	}

	/**
	 * Sets a new random gateway
	 */
	setRandomGateway() {
		if (this.option == this.gatewayOptions['RANDOM'])
			this.currentGateway = this.getRandom();
		else
			throw "Error: gateways 'option' is not set to random";
	}

	getGatewaysList() {
		let fullGatewaysList = {};

		for (let gateway in this.default) {
	        fullGatewaysList[gateway] = this.default[gateway];
	    }

	    // delete removed gateways
	    for (let gateway in this.removed) {
	        delete fullGatewaysList[gateway];
	    }

	    // add "added gateways"
	    for (let gateway in this.custom) {
	        fullGatewaysList[gateway] = this.custom[gateway];
	    }

	    return fullGatewaysList;	
	}

	isGatewayInList(key) {
		let list = this.getGatewaysList();
		if (key in list)
			return true;
		else
			return false;
	}

	restoreToDeafult() {
		this.custom = {};
		this.removed = {};

		if (this.option !== this.gatewayOptions['OTHER'])
			if (this.currentGateway.key in this.custom) {
				this.option = this.gatewayOptions['RANDOM'];
				this.setRandomGateway();
			}
	}
}


function reportError(e) {
	console.log("error: ", e);
}
