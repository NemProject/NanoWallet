class NodeRewardsProgramCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Wallet, DataStore) {
        'ngInject';

        //// Module dependencies region ////

        this._Wallet = Wallet;
        this._DataStore = DataStore;

        //// End dependencies region ////
    }

}

export default NodeRewardsProgramCtrl;
