import nem from 'nem-sdk';

class OfflineTransactionSendCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Alert, AppConstants, $timeout, $state) {
        'ngInject';

        //// Module dependencies region ////

        this._Alert = Alert;
        this._AppConstants = AppConstants;
        this._$timeout = $timeout;
        this._$state = $state;

        //// End dependencies region ////

        /*if(/Firefox/.test(navigator.userAgent)) {
            this.hideScan = false;
        } else {
            this.hideScan = true;
        }*/

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        this.okPressed = false;
        this.network = this._AppConstants.defaultNetwork;
        // Available networks
        this.networks = nem.model.network.data;
        this.nodes = nem.model.nodes.mainnet;
        this.selectedNode = this.nodes[0].uri;
        this.transaction = this._$state.params.signedTransaction ? this._$state.params.signedTransaction : '';
        this.scanner = undefined;
    }

    changeNodes() {
        if (this.network == nem.model.network.data.mainnet.id) {
            this.nodes = nem.model.nodes.mainnet;
        } else if (this.network == nem.model.network.data.testnet.id) {
            this.nodes = nem.model.nodes.testnet;
        } else {
            this.nodes = nem.model.nodes.mijin;
        }
        this.selectedNode = this.nodes[0].uri;
        return;
    }

    /*showHideReader() {
        if(this.showReader === true) {
            this.showReader = false;
            this.scanner.stop();
            this.scanner = undefined;
        } else {
            this.showReader = true
            this.startReader();
        }
    }

    startReader() {
        this.scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
        this.scanner.addListener('scan', (content) => {
            this._$timeout(() => {
                this.transaction = content;
                this.scanner.stop();
                this.showReader = false;
            });
        });
        Instascan.Camera.getCameras().then((cameras) => {
            if (cameras.length > 0) {
                this.scanner.start(cameras[0]);
            } else {
                console.error('No cameras found.');
            }
        }).catch((e) => {
            console.error(e);
        });
    }*/

    /**
     * Broadcast the transaction to the network
     */
    send() {
        this.okPressed = true;
        // Check form for errors
        if(!this.transaction) return;

        let endpoint = nem.model.objects.create("endpoint")(this.selectedNode, this.network === nem.model.network.data.mijin.id ? nem.model.nodes.mijinPort : nem.model.nodes.defaultPort);

        // Send
        nem.com.requests.transaction.announce(endpoint, this.transaction).then((res) => {
            this._$timeout(() => {
                // If res code >= 2, it's an error
                if (res.code >= 2) {
                    this._Alert.transactionError(res.message);
                } else {
                    this._Alert.transactionSuccess();
                    let audio = new Audio('vendors/ding.ogg');
                    audio.play();
                }
                // Enable send button
                this.okPressed = false;
                if (this._$state.params.signedTransaction) this._$state.params.signedTransaction = '';
                // Reset all
                this.init();
                return;
            });
        }, (err) => {
            this._$timeout(() => {
                if(err.code < 0) {
                    this._Alert.connectionError();
                }  else {
                    this._Alert.transactionError('Failed: '+ err.data.message);
                }
                // Enable send button
                this.okPressed = false;
                return;
            });
        })
    }

    //// End methods region ////

}

export default OfflineTransactionSendCtrl;