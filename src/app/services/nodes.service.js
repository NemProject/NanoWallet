import nem from 'nem-sdk';
import UrlParser from 'url-parse';

/** Service with functions regarding the nodes */
class Nodes {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, Wallet, Alert, $filter, $timeout) {
        'ngInject';

        //// Service dependencies region ////

        this._storage = $localStorage;
        this._Wallet = Wallet;
        this._Alert = Alert;
        this._$filter = $filter;
        this._$timeout = $timeout;

        //// End dependencies region ////
    }

    //// Service methods region ////

    /**
     * Set util nodes according to network
     */
    setUtil() {
        if (this._Wallet.network === nem.model.network.data.testnet.id) {
            this._Wallet.searchNode = nem.model.objects.create("endpoint")(nem.model.nodes.searchOnTestnet[0].uri, nem.model.nodes.defaultPort);
            this._Wallet.chainLink = nem.model.nodes.testnetExplorer;
        } else if (this._Wallet.network === nem.model.network.data.mainnet.id) {
            this._Wallet.searchNode = nem.model.objects.create("endpoint")(nem.model.nodes.searchOnMainnet[0].uri, nem.model.nodes.defaultPort);
            this._Wallet.chainLink = nem.model.nodes.mainnetExplorer;
        } else {
            this._Wallet.searchNode = nem.model.objects.create("endpoint")(nem.model.nodes.searchOnMijin[0].uri, nem.model.nodes.mijinPort);
            this._Wallet.chainLink = nem.model.nodes.mijinExplorer;
        }
        return;
    }

    /**
     * Check if nodes present in local storage or set default according to network
     */
    setDefault() {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            if (this._storage.selectedMainnetNode) {
                this._Wallet.node = this._storage.selectedMainnetNode;
            } else {
                let endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.mainnet[0].uri, nem.model.nodes.defaultPort);
                this._Wallet.node = endpoint;
            }
            this._Wallet.nodes = nem.model.nodes.mainnet;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            if (this._storage.selectedTestnetNode) {
                this._Wallet.node = this._storage.selectedTestnetNode;
            } else {
                let endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.testnet[0].uri, nem.model.nodes.defaultPort);
                this._Wallet.node = endpoint;
            }
            this._Wallet.nodes = nem.model.nodes.testnet;
        } else {
            if (this._storage.selectedMijinNode) {
                this._Wallet.node = this._storage.selectedMijinNode;
            } else {
                let endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.mijin[0].uri, nem.model.nodes.mijinPort);
                this._Wallet.node = endpoint;
            }
            this._Wallet.nodes = nem.model.nodes.mijin;
        }
        return;
    }

    /**
     * Update the node in Wallet service and update local storage
     * If no endpoint provided a random node will be used
     *
     * @param {object} endpoint - An endpoint object (optional)
     */
    update(endpoint) {
        let _endpoint;
        // Set node in local storage according to network
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            _endpoint = endpoint || nem.model.objects.create("endpoint")(nem.model.nodes.mainnet[Math.floor(Math.random()*nem.model.nodes.mainnet.length)].uri, nem.model.nodes.defaultPort);
            this._storage.selectedMainnetNode = _endpoint;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            _endpoint = endpoint || nem.model.objects.create("endpoint")(nem.model.nodes.testnet[Math.floor(Math.random()*nem.model.nodes.testnet.length)].uri, nem.model.nodes.defaultPort);
            this._storage.selectedTestnetNode = _endpoint;
        } else {
            _endpoint = endpoint || nem.model.objects.create("endpoint")(nem.model.nodes.mijin[Math.floor(Math.random()*nem.model.nodes.mijin.length)].uri, nem.model.nodes.mijinPort);
            this._storage.selectedMijinNode = _endpoint;
        }
        // Set endpoint in Wallet service
        this._Wallet.node = _endpoint;
        return;
    }

    /**
     * Clean an host input and create an endpoint object if valid
     *
     * @param {string} host - An NIS hostname
     * @param {number} port - An NIS port (optional)
     *
     * @return {object|boolean} - An endpoint object if success, false otherwise
     */
    cleanEndpoint(host, port) {
        // Validate host
        var regexp = /^(?:(?:https?):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        if(!regexp.test(host) && (host !== 'http://localhost' && host !== 'localhost')) {
            console.log("Invalid endpoint");
            return false;
        }
        // Create an empty endpoint object
        let endpoint = nem.model.objects.get("endpoint");

        // Parse the url given by user
        let parsed = new UrlParser(host);

        // Check if protocol is set or set default
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') parsed = new UrlParser('http://' + host);

        // Set host in endpoint object
        endpoint.host = parsed.protocol + '//' + parsed.hostname;

        // Arrange port, set default if not specified
        if (parsed.port) {
            endpoint.port = parsed.port;
        } else if (port) {
            endpoint.port = port;
        } else {
            if (this._Wallet.network === nem.model.network.data.mainnet.id) {
                endpoint.port = nem.model.nodes.defaultPort;
            } else if (this._Wallet.network === nem.model.network.data.testnet.id) {
                endpoint.port = nem.model.nodes.defaultPort;
            } else {
                endpoint.port = nem.model.nodes.mijinPort;
            }
        }
        return endpoint;
    }

    /**
     * Return nodes according to a network
     *
     * @param {number} network - A network id (optional)
     * @param {boolean} searchEnabled - True if getting nodes with search enabled, false otherwise (optional)
     *
     * @return {array} - An array of endpoint objects
     */
    get(network, searchEnabled) {
        let _network = network || this._Wallet.network;
        let _searchEnabled = searchEnabled || false;
        // Show right nodes list according to network
        if (_network == nem.model.network.data.mainnet.id) {
            if (_searchEnabled) return this._$filter('toEndpoint')(nem.model.nodes.searchOnMainnet);
            return this._$filter('toEndpoint')(nem.model.nodes.mainnet);
        } else if (_network == nem.model.network.data.testnet.id) {
            if (_searchEnabled) return this._$filter('toEndpoint')(nem.model.nodes.searchOnTestnet);
            return this._$filter('toEndpoint')(nem.model.nodes.testnet);
        } else {
            if (_searchEnabled) return this._$filter('toEndpoint')(nem.model.nodes.searchOnMijin);
            return this._$filter('toEndpoint')(nem.model.nodes.mijin);
        }
    }

    /**
     * Get harvesting node from local storage if it exists
     */
    getHarvestingEndpoint() {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            if (this._storage.harvestingMainnetNode) return this._storage.harvestingMainnetNode;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            if (this._storage.harvestingTestnetNode) return this._storage.harvestingTestnetNode;
        } else {
            if (this._storage.harvestingMijinNode) return this._storage.harvestingMijinNode;
        }
        return this._Wallet.node;
    }

    /**
     * Save the harvesting node in local storage according to network
     */
    saveHarvestingEndpoint(endpoint) {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            this._storage.harvestingMainnetNode = endpoint;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            this._storage.harvestingTestnetNode = endpoint;
        } else {
            this._storage.harvestingMijinNode = endpoint;
        }
    }

    /**
     * Check if a node has free slots
     *
     * @param  {object} endpoint - An endpoint object
     */
    hasFreeSlots(endpoint) {
        if (!endpoint) return false;
        return nem.com.requests.account.unlockInfo(endpoint).then((data) => {
            return this._$timeout(() => {
                if (data["max-unlocked"] === data["num-unlocked"]) {
                    return false;
                } else {
                    return true;
                }
            });
        },
        (err) => {
            return this._$timeout(() => {
                this._Alert.unlockedInfoError(err.data.message);
                return false;
            });
        });
    }

    //// End methods region ////

}

export default Nodes;
