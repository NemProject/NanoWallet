import nem from "nem-sdk";

function DecodeMessage(Wallet, Recipient, Alert, $timeout, $filter, $sanitize) {
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

            /**
             * Decode an encrypted message in a transaction
             *
             * @param {object} tx - A transaction object
             */
            scope.decode = (tx) => {
                // Get account private key
                if (!Wallet.decrypt(scope.common)) return;

                // Create key pair
                let kp = nem.crypto.keyPair.create(scope.common.privateKey);

                // If not the sender, use signer public key for decryption
                if(kp.publicKey.toString() !== tx.signer) {
                    scope.processDecode(tx.signer, tx);
                } else {
                    // Get the recipient account data for the public key
                    Recipient.getAccount(tx.recipient).then((res) => {
                        $timeout(() => {
                            //
                            scope.processDecode(res.account.publicKey, tx);
                            return;
                        });
                    },
                    (err) => {
                        $timeout(() => {
                            // Reset common
                            scope.common = nem.model.objects.get("common");;
                            Alert.getAccountDataError(err.statusText);
                            return;
                        });
                    });
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

                // Decode the message
                let decoded = nem.crypto.helpers.decode(scope.common.privateKey, publicKey, tx.message.payload);
                if (!decoded) return Alert.emptyDecodedMessage("");
                            
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
            }
        }

    };
}

export default DecodeMessage;