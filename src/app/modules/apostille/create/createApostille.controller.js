import nem from 'nem-sdk';
import Helpers from '../../../utils/helpers';

class CreateApostilleCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor(Nty, DataStore, $filter, Alert, Wallet, $timeout, $state) {
        'ngInject';

        //// Module dependencies region ////

        this._Nty = Nty;
        this._DataStore = DataStore;
        this._$filter = $filter;
        this._Alert = Alert;
        this._Wallet = Wallet;
        this._$timeout = $timeout;
        this._$state = $state;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init() {
        this.isUpdate = this._$state.params.isUpdate;
        // Object to contain our password & private key data
        this.common = nem.model.objects.get("common");
        // Form is based on a transfer transaction object
        this.formData =  nem.model.objects.get("transferTransaction");
        this.formData.messageType = 0;
        this.formData.tags = this._$state.params.tags;
        this.formData.isText = false;
        this.formData.selectedHashing = nem.model.apostille.hashing["SHA256"];
        this.formData.isPrivate = true;
        this.formData.textTitle = "";
        this.formData.textContent = "";
        // Available hashing methods
        this.hashing = nem.model.apostille.hashing;
        this.types = [{
            name: this._$filter('translate')('GENERAL_PUBLIC'),
            value: false
        },{
            name: this._$filter('translate')('APOSTILLE_KEEP_PRIVATE'),
            value: true
        }];
        // Array of apostilles to send
        this.apostilles = [];
        // Array of apostilles rejected, kept if re-init
        this.rejected = this.rejected ? this.rejected : [];
        // Prevent user to click twice on send when already processing
        this.okPressed = false;
        // Pagination properties
        this.currentPage = 0;
        this.currentPageRej = 0;
        this.pageSize = 5;
        // Set nty data in Wallet service if exists in local storage
        this._Nty.set();
        // Init JSzip
        this.zip = new JSZip();
    }

    /**
     * Process the file to apostille and push to array
     *
     * @param {object} $fileContent - Base 64 content of the file 
     * @param {object} $fileData - Meta data of the file
     */
    processFile($fileContent, $fileData) {
        // Get account private key for preparation or return
        if (!this._Wallet.decrypt(this.common)) return;
        // Only 25 apostilles per batch
        if (this.apostilles.length > 24) return;
        // Arrange data if custom text
        if (this.formData.isText) {
            $fileData = { 
                name: $fileData + ".txt", 
                lastModified: new Date().getTime(), 
                lastModifiedDate: new Date().toISOString(), 
                size: Buffer.byteLength($fileContent, 'utf8'), 
                type: "text/plain" 
            }
            $fileContent = "data:application/x-pdf;base64," + nem.crypto.js.enc.Base64.stringify(nem.crypto.js.enc.Utf8.parse($fileContent));
        }
        //
        let rawFileContent = nem.crypto.js.enc.Base64.parse($fileContent.split(/,(.+)?/)[1]);
        // Create the apostille
        let apostille = nem.model.apostille.create(this.common, $fileData.name, rawFileContent, this.formData.tags, this.formData.selectedHashing, this.formData.isMultisig, this.formData.multisigAccount, this.formData.isPrivate, this._Wallet.network);
        
        // Arrange apostille for update
        if(this.isUpdate) {
            // Set original dedicated account into apostille
            apostille.data.dedicatedAccount.address = this._$state.params.address;
            apostille.data.dedicatedAccount.privateKey = this._$state.params.privateKey;
            // Set original dedicated account as recipient
            if (apostille.transaction.type === nem.model.transactionTypes.multisigTransaction) {
                apostille.transaction.otherTrans.recipient = this._$state.params.address;
            } else {
                apostille.transaction.recipient = this._$state.params.address;
            }
        }

        this.apostilles.push(apostille);
    }

    /**
     * Trigger file uploading for nty
     */
    uploadNty() {
        document.getElementById("uploadNty").click();
    }

    /**
     * Save nty in Wallet service and local storage
     *
     * @params {object} $fileContent - Content of an nty file
     */
    loadNty($fileContent) {
        this._Nty.setInLocalStorage(JSON.parse($fileContent));
        if (this._Wallet.ntyData.length) {
            this._Alert.ntyFileSuccess();
        }
    }

    /**
     * Remove a file from filesToApostille array
     *
     * @param {array} array - The array of files to apostilles
     * @param {object} elem - The object to delete
     */
    removeFileFromList(array, elem) {
        // If the deleted element is the elem 0 and length of array mod 5 gives 0 (means it is the last object of the page), 
        // we return a page behind unless it is page 1.
        if (array.indexOf(elem) === 0 && this.currentPage + 1 > 1 && (array.length - 1) % 5 === 0) {
            this.currentPage = this.currentPage - 1;
        }
        array.splice(array.indexOf(elem), 1);
    }

    /**
     * Build the apostille file and certificate
     *
     * @param {object} announceResult - A NEM announce result object
     * @param {object} apostille - An apostille object
     * @param {number} i - The position of the apostille object in the array of apostilles
     */
    buildApostille(announceResult, apostille, i) {
        let isMultisig = apostille.transaction.type === nem.model.transactionTypes.multisigTransaction;
        let timeStamp = new Date();
        let hash = announceResult.transactionHash.data;
        let multisigHash = isMultisig ? announceResult.innerTransactionHash.data : '';
        let url = isMultisig ? this._Wallet.chainLink + multisigHash : this._Wallet.chainLink + hash;
        let owner = this._Wallet.currentAccount.address;
        let from = isMultisig ? nem.model.address.toAddress(apostille.transaction.otherTrans.signer, this._Wallet.network) : this._Wallet.currentAccount.address;
        let apostilleName = Helpers.getFileName(apostille.data.file.name) + " -- Apostille TX " + hash + " -- Date " + Helpers.toShortDate(timeStamp) + "." + Helpers.getExtension(apostille.data.file.name);
        let message = isMultisig ? apostille.transaction.otherTrans.message.payload : apostille.transaction.message.payload;
        let recipient = apostille.data.dedicatedAccount.address;
        let recipientPrivateKey = apostille.data.dedicatedAccount.privateKey;
        // Create or update nty data if exist
        this._Nty.updateData(this._Nty.createData(apostille.data.file.name, apostille.data.tags, timeStamp, message, hash, multisigHash, owner, from, recipient, recipientPrivateKey));
        // Draw certificate then push files into archive
        this._Nty.drawCertificate(apostille.data.file.name, timeStamp.toDateString(), owner, apostille.data.tags, from, recipient, recipientPrivateKey, hash, message, url).then((certificate) => {
            this._$timeout(() => {
                // Add renamed file to archive
                this.zip.file(apostilleName, (nem.crypto.js.enc.Base64.stringify(apostille.data.file.content)), {
                    base64: true
                });
                // Add certificate to archive
                this.zip.file("Certificate of " + Helpers.getFileName(apostille.data.file.name) + " -- TX " + hash + " -- Date " + Helpers.toShortDate(timeStamp) + ".png", (certificate).split(",").pop(), {
                    base64: true
                });
                // If last file of the array
                if (i === this.apostilles.length - 1) {
                    // Download archive of files
                    this.downloadSignedFiles();
                    return;
                }
            });
        });
    }

    /**
     * Download the archive of signed files
     */
    downloadSignedFiles() {
        // Trigger if at least 1 file and 1 certificate in the archive
        if (Object.keys(this.zip.files).length > 1) {
            // Add created or updated nty file to archive
            this.zip.file("Nty-file-" + Helpers.toShortDate(new Date()) + ".nty", JSON.stringify(this._Wallet.ntyData));
            // Generate the zip
            this.zip.generateAsync({
                type: "blob"
            }).then((content) => {
                // Trigger download
                saveAs(content, "NEMsigned -- Do not Edit -- " + Helpers.toShortDate(new Date()) + ".zip");
                this._$timeout(() => {
                    // Reset all
                    return this.init();
                })
            });
        }
    }

    /**
     * Prepare and broadcast the transaction to the network
     */
    send() {
        // Disable send button
        this.okPressed = true;

        // Get account private key for preparation or return
        if (!this._Wallet.decrypt(this.common)) return this.okPressed = false;

        if (this.apostilles.length) {
            // Chain of promises
            let chain = (i) => {
                if (i < this.apostilles.length) {
                    this._Wallet.transact(this.common, this.apostilles[i].transaction).then((res) => {
                        this._$timeout(() => {
                            this.buildApostille(res, this.apostilles[i], i);
                        });
                    }, (err) => {
                        this._$timeout(() => {
                            this.apostilles[i].reason = err;
                            this.rejected.push(this.apostilles[i]);
                            // If last file of the array
                            if (i === this.apostilles.length - 1) {
                                // Download archive of files
                                this.downloadSignedFiles();
                                // Delete private key in common
                                this.common.privateKey = '';
                                // Enable send button
                                this.okPressed = false;
                                return;
                            }
                        });
                    }).then(chain.bind(null, i+1));
                }
            }

            // Start promises chain
            chain(0);
        }
    }

    //// End methods region ////

}

export default CreateApostilleCtrl;