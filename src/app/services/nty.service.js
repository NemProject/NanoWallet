import nem from 'nem-sdk';

/** Service storing wallet data and relative functions on user wallet. */
class Nty {

    /**
     * Initialize services and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, Wallet) {
        'ngInject';

        /**
         * Service dependencies
         */

        // Local storage
        this._storage = $localStorage;

        // Wallet service
        this._Wallet = Wallet;
    }

    /**
     * Set nty data in Wallet service if exists in local storage
     */
    set() {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            if (this._storage.ntyMainnet) {
                this._Wallet.ntyData = this._storage.ntyMainnet;
            }
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            if (this._storage.ntyTestnet) {
                this._Wallet.ntyData = this._storage.ntyTestnet;
            }
        } else {
            if (this._storage.ntyMijin) {
                this._Wallet.ntyData = this._storage.ntyMijin;
            }
        }
    }

    /**
     * Set nty data into local storage and update in service
     *
     * @param data: The nty data
     */
    setInLocalStorage(data) {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            this._storage.ntyMainnet = data;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            this._storage.ntyTestnet = data;
        } else {
            this._storage.ntyMijin = data;
        }
        this._Wallet.ntyData = data;
    }

    /**
     * Purge nty data from local storage and update in service
     */
    purgeLocalStorage() {
        if (this._Wallet.network == nem.model.network.data.mainnet.id) {
            delete this._storage.ntyMainnet;
        } else if (this._Wallet.network == nem.model.network.data.testnet.id) {
            delete this._storage.ntyTestnet;
        } else {
            delete this._storage.ntyMijin;
        }
        this._Wallet.ntyData = undefined;
    }
    /**
     * Create notary data
     *
     * @param {string} filename - A file name
     * @param {string} tags - File tags
     * @param {number} timestamp - A timestamp
     * @param {string} fileHash - File hash
     * @param {string} txHash - Transaction hash
     * @param {string} txMultisigHash - Multisignature transaction hash
     * @param {string} owner - Account address
     * @param {string} fromMultisig - Multisig account address
     * @param {string} dedicatedAccount - HD account of the file
     * @param {string} dedicatedPrivateKey - Private key of the HD account
     *
     * @return {array} - The notary data
     */
    createData(filename, tags, timestamp, fileHash, txHash, txMultisigHash, owner, fromMultisig, dedicatedAccount, dedicatedPrivateKey) {
        return {
                "filename": filename,
                "tags": tags,
                "fileHash": fileHash,
                "owner": owner,
                "fromMultisig": fromMultisig,
                "dedicatedAccount": dedicatedAccount,
                "dedicatedPrivateKey": dedicatedPrivateKey,
                "txHash": txHash,
                "txMultisigHash": txMultisigHash,
                "timeStamp": timestamp.toUTCString()
        };
    }

    /**
     * Update notary data
     *
     * @param {object} ntyData - A notary data object
     */
    updateData(ntyData) {
        if (!this._Wallet.ntyData) {
            this._Wallet.ntyData = {"data": [ntyData] };
            this.setInLocalStorage(this._Wallet.ntyData);
        } else {
            this._Wallet.ntyData.data.push(ntyData);
            this.setInLocalStorage(this._Wallet.ntyData);
        }
        return this._Wallet.ntyData;
    }

    /**
     * Draw an apostille certificate
     */
    drawCertificate(filename, dateCreated, owner, tags, from, to, recipientPrivateKey, txHash, txHex, url) {
        return new Promise((resolve, reject) => {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');

            let imageObj = new Image();
            imageObj.onload = () => {
                context.canvas.width = imageObj.width;
                context.canvas.height = imageObj.height;
                context.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height);
                context.font = "38px Roboto Arial sans-serif";
                // Top part
                context.fillText(filename, 541, 756);
                context.fillText(dateCreated, 607, 873);
                context.fillText(owner, 458, 989);
                context.fillText(tags, 426, 1105);

                // bottom part
                context.font = "30px Roboto Arial sans-serif";
                context.fillText(from, 345, 1550);
                context.fillText(to, 345, 1690);
                context.fillText(recipientPrivateKey, 345, 1846);
                context.fillText(txHash, 345, 1994);

                // Wrap file hash if too long
                if (txHex.length > 70) {
                    let x = 345;
                    let y = 2137;
                    let lineHeight = 35;
                    let lines = txHex.match(/.{1,70}/g)
                    for (var i = 0; i < lines.length; ++i) {
                        context.fillText(lines[i], x, y);
                        y += lineHeight;
                    }
                } else {
                    context.fillText(txHex, 345, 2137);
                }
                let qr = qrcode(10, 'H');
                qr.addData(url);
                qr.make();
                let tileW = 500  / qr.getModuleCount();
                let tileH = 500 / qr.getModuleCount();
                for( let row = 0; row < qr.getModuleCount(); row++ ){
                    for( let col = 0; col < qr.getModuleCount(); col++ ){
                        context.fillStyle = qr.isDark(row, col) ? "#000000" : "#ffffff";
                        let w = (Math.ceil((col+1)*tileW) - Math.floor(col*tileW));
                        let h = (Math.ceil((row+1)*tileW) - Math.floor(row*tileW));
                        context.fillRect(Math.round(col*tileW)+1687,Math.round(row*tileH)+688, w, h);  
                    }
                }
                return resolve(canvas.toDataURL());
            };
            // Check if chrome or safari for CORS issue fix
            let isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            let isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
            imageObj.crossOrigin = "Anonymous";
            imageObj.src = (isChrome || isSafari) ? "https://raw.githubusercontent.com/bad-weather-corp/NEMWallet/master/src/images/certificate.png" : "./images/certificate.png";
        });
    }

}

export default Nty;