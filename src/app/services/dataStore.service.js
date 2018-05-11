import nem from 'nem-sdk';

/** Service storing data fetched from network */
class DataStore {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, $filter, $timeout) {
        'ngInject';

        //// Service dependencies region ////

        this._storage = $localStorage;
        this._$filter = $filter;
        this._$timeout = $timeout;

        //// End dependencies region ////

        // Initialize with default values
        this.init();
    }

    //// Service methods region ////

    init() {
        //// Chain related data ////

        this.chain = {
            height: 0,
            time: 0
        }

        //// Connectivity related data ////

        this.connection = {
            connector: undefined,
            status: false
        }

        //// Current account related data ////

        this.account = {
            metaData: undefined,
            metaDataOf: {},
            transactions: {
                confirmed: [],
                unconfirmed: []
            },
            harvesting: {
                blocks: []
            },
            delegated: {
                metaData: undefined
            }
        }

        //// Mosaic related data ////

        this.mosaic = {
            metaData: {},
            ownedBy: {}
        }

        //// Namespace related data ////

        this.namespace = {
            ownedBy: {}
        }

        //// Market related data ////

        this.market = {
            xem: undefined,
            btc: undefined,
            selected: 'XEM'
        }
    }

    //// End methods region ////

}

export default DataStore;