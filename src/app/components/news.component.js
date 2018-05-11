import nem from "nem-sdk";
import Helpers from '../utils/helpers';

class NewsCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Alert, $timeout, $http) {
        'ngInject';

        //// Component dependencies region ////
        
        this._Alert = Alert;
        this._$timeout = $timeout;
        this._Helpers = Helpers;
        this._$http = $http;

        //// End dependencies region ////

        //// Component properties region ////

        this.refreshNews();

         //// End properties region ////

    }

    //// Component methods region ////

	/**
	 * Refresh market information
	 */
	refreshNews() {
        return this._$http.get('').then((res) => {
        	console.log(res);
            //return res.data;
		}, (err) => {
			console.log(err);
		});
	}

    //// End methods region ////

}

// MarketData config
let News = {
    controller: NewsCtrl,
    templateUrl: 'layout/partials/news.html'
};

export default News;