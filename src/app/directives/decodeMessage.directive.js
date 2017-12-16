import nem from "nem-sdk";

function DecodeMessage(Wallet, Recipient, Alert, Trezor, $timeout, $filter, $sanitize) {
    'ngInject';

    return {
        restrict:'E',
        scope: {
        	tx: '=',
            showDecodeMessage: '=',
            disableDecryption: '='
        },
        template: '<ng-include src="templateDecodeMessage"/>',
        link: (scope) => {
        	scope.templateDecodeMessage = 'layout/partials/decodeMessage.html';
            scope.common = nem.model.objects.get("common");
            scope.Wallet = Wallet;

            let sender = nem.model.address.toAddress(scope.tx.signer, Wallet.network);

            // If not the sender, use signer public key for decryption
            if(Wallet.currentAccount.address !== sender) {
                scope.publicKey = scope.tx.signer;
            } else {
                // Get the recipient account data for the public key
                Recipient.getAccount(scope.tx.recipient).then((res) => {
                    scope.publicKey = res.account.publicKey;
                },
                (err) => {
                    $timeout(() => {
                        Alert.getAccountDataError(err.statusText);
                    });
                });
            }

            /**
             * Decode an encrypted message in a transaction
             */
            scope.decode = () => {
                // Get account private key
                if (!Wallet.decrypt(scope.common)) return;

                return scope.processDecode(scope.publicKey, scope.tx);
            };

            scope._processDecode = (common, publicKey, tx) => {
                if (common.isHW) {
                    if (Wallet.algo == "trezor") {
                        return Trezor.decryptMessage(Wallet.currentAccount, publicKey, tx.message.payload);
                    }
                } else {
                    // Decode the message
                    let decoded = nem.crypto.helpers.decode(common.privateKey, publicKey, tx.message.payload);
                    if (decoded) {
                        return Promise.resolve(decoded);
                    } else {
                        return Promise.reject("");
                    }
                }
            };

            /**
             * Do decoding and set result in the transaction template
             *
             * @param {string} publicKey - The public key of the signer or recipient
             * @param {object} tx - A transaction object
             */
            scope.processDecode = (publicKey, tx)  =>{
                // Check public key
                if(!publicKey) return Alert.noPublicKeyForDecoding();

                return scope._processDecode(scope.common, publicKey, tx).then((decoded) => {
                    $timeout(() => {
                        // Set decrypted message in the right template,
                        // use the tx timeStamp to identify each element in the array of templates generated with
                        // ng-repeat and tag-transaction directive.
                        // There is two parts in the template, the line and the details
                        let parts = ["line", "details"];
                        for (let i = 0; i < parts.length; i++) {
                            $("#"+parts[i]+"-" + tx.timeStamp).html($sanitize($filter('fmtHexMessage')({
                                "type": 1,
                                "payload": decoded
                            })));
                        }
                        // Reset common
                        scope.common = nem.model.objects.get("common");
                        // Remove the the decode part of the template
                        $("#decodeTxMessage-" + tx.timeStamp).remove();
                    });
                },
                (err) => {
                    $timeout(() => {
                        // Reset common
                        scope.common = nem.model.objects.get("common");
                        Alert.emptyDecodedMessage(err);
                    });
                });
            }
        }

    };
}

export default DecodeMessage;