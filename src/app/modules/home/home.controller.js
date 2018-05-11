import nem from 'nem-sdk';
import Helpers from '../../utils/helpers';

class HomeCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(AppConstants, $localStorage, $http) {
        'ngInject';

        //// Module dependencies region ////

        this._storage = $localStorage;
        this._$http = $http;
        this._AppConstants = AppConstants;

        //// End dependencies region ////

        //// Module properties region ////

        this.appName = AppConstants.appName;
        this.newUpdate = false;
        this.updateInfo = {};

        //// End properties region ////

        this.checkBrowser();
        this.getGeolocation();
        this.checkLatestVersion();
    }

    //// Module methods region ////

    /**
     * Check if browser is supported or show an un-dismassable modal
     */
    checkBrowser() {
        // Detect recommended browsers
        let isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        let isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
        let isFirefox = /Firefox/.test(navigator.userAgent);

        // If no recommended browser used, open modal
        if(!isChrome && !isSafari && !isFirefox) {
            $('#noSupportModal').modal({
              backdrop: 'static',
              keyboard: false
            }); 
        }
    }

    /**
     * Get closest node from geolocation, if user agrees
     */
    getGeolocation() {
        // If no mainnet node in local storage
        if (navigator.geolocation && !this._storage.selectedMainnetNode) {
            // Get position
            navigator.geolocation.getCurrentPosition((res) => {
                // Get the closest nodes
                nem.com.requests.supernodes.nearest(res.coords).then((res) => {
                    // Pick a random node in the array
                    let node = res.data[Math.floor(Math.random()*res.data.length)];
                    // Set the node in local storage
                    this._storage.selectedMainnetNode = nem.model.objects.create("endpoint")("http://"+node.ip, 7890);
                }, (err) => {
                    // If error it will use default node
                    console.log(err);
                });
            }, (err) => {
                console.log(err);
                // Get all the active supernodes
                nem.com.requests.supernodes.get(1).then((res) => {
                    // Pick a random node in the array
                    let node = res.data[Math.floor(Math.random()*res.data.length)];
                    // Set the node in local storage
                    this._storage.selectedMainnetNode = nem.model.objects.create("endpoint")("http://"+node.ip, 7890);
                }, (err) => {
                    // If error it will use default node
                    console.log(err);
                });
            });
        }
    }

    /**
     * Check if a new version is available on Github
     */
    checkLatestVersion() {
        this._$http.get("https://api.github.com/repos/NemProject/NanoWallet/releases/latest").then((res) => {
            let currentVersion = this._AppConstants.version;
            let version = res.data.name;
            let isVersion2 = parseInt(version.split(".")[0]) > 1;
            if (isVersion2 && Helpers.versionCompare(currentVersion, version) < 0) {
                this.newUpdate = true;
                this.updateInfo = res.data;
            }
        });
    }

    //// End methods region ////
}

export default HomeCtrl;