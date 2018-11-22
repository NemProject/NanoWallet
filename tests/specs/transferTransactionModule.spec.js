import WalletFixture from '../data/wallet';
import AccountDataFixture from '../data/accountData';
import nem from 'nem-sdk';

describe('Transfer transaction module tests', function() {
    let $controller, $rootScope, Wallet, DataStore, Nodes;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function( _$controller_, _$rootScope_, _Wallet_, _DataStore_, _Nodes_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        Wallet = _Wallet_;
        DataStore = _DataStore_;
        Nodes = _Nodes_;
    }));

    function createDummyWalletContextTestnet(Wallet) {
    	Wallet.use(WalletFixture.testnetWallet);
        Nodes.setDefault();

        DataStore.account.metaData = AccountDataFixture.testnetAccountData;
        DataStore.namespace.ownedBy = AccountDataFixture.testnetNamespaceOwned;
        DataStore.mosaic.ownedBy =  AccountDataFixture.testnetMosaicOwned;
        DataStore.mosaic.metaData = AccountDataFixture.testnetMosaicDefinitionMetaDataPair;
        DataStore.chain.height = 999999999;

    }

    it("Default properties initialized", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });

        // Assert
        expect(ctrl.formData).toEqual({
        "amount": 0,
        "recipient": "",
        "recipientPublicKey": "",
        "isMultisig": false,
        "multisigAccount" : {
            "address": "TBUSUKWVVPS7LZO4AF6VABQHY2FI4IIMCJGIVX3X",
            "harvestedBlocks": 0,
            "balance": 16000000,
            "importance": 0,
            "vestedBalance": 0,
            "publicKey": "671ca866718ed174a21e593fc1e250837c03935bc79e2daad3bd018c444d78a7",
            "label": null,
            "multisigInfo": {
                "cosignatoriesCount": 1,
                "minCosignatories": 1
            }
        },
        "message": "",
        "messageType" : 1,
        "mosaics": null
        });
        expect(ctrl.isMosaicTransfer).toBe(false);
        expect(ctrl.currentAccountMosaicData).toEqual(ctrl._DataStore.mosaic.ownedBy[ctrl._Wallet.currentAccount.address]);
        expect(ctrl.selectedMosaic).toEqual("nem:xem");
        expect(ctrl.okPressed).toBe(false);
        expect(ctrl.common).toEqual(nem.model.objects.get("common"));
    });

    it("Can update fee", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });

        // Act
        ctrl.prepareTransaction();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(50000);
    });

    it("Update fee on amount change", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.amount = 20000;
        ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(100000);
    });

    it("Update fee on message change", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.message = "Hello";
        ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(100000);
    });

    it("Update fee if multisig", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.isMultisig = true;
        ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(nem.model.fees.multisigTransaction);
        expect(ctrl.preparedTransaction.otherTrans.fee).toBe(50000);
    });

    it("Update fee if mosaic transfer (empty)", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(0);
    });

    it("Update fee if multisig and mosaic transfer (empty)", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.isMultisig = true;
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.otherTrans.fee).toBe(0);
        expect(ctrl.preparedTransaction.fee).toBe(150000);
    });

    it("Fee cap is 1.25 XEM", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.amount = 500000;
        ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(1250000);
    });

    it("Calculate right fees for mosaics", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        // Push a mosaicAttachment with a text amount
        ctrl.formData.mosaics.push(nem.model.objects.create("mosaicAttachment")("nem", "xem", "150000"));
        scope.$digest();
        // Will calculate the right amount from text
        ctrl.prepareTransaction();

        // Assert
        expect(ctrl.preparedTransaction.fee).toBe(750000);
    });

    it("Calculate right fees for multisig mosaic transfers", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.isMultisig = true;
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        // Push a mosaicAttachment with a text amount
        ctrl.formData.mosaics.push(nem.model.objects.create("mosaicAttachment")("nem", "xem", "150000"));
        scope.$digest();
        ctrl.prepareTransaction();

        // Assert
        expect(ctrl.preparedTransaction.otherTrans.fee).toBe(750000);
        expect(ctrl.preparedTransaction.fee).toBe(150000);
    });

    it("Encrypt message disabled if multisig", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.formData.messageType = 2; // Encrypted
        ctrl.formData.isMultisig = true;
        // Done directly in view when click on multisig tab, set encrypt message to false
        ctrl.formData.messageType = 1;
        scope.$digest();

        // Assert
        expect(ctrl.formData.messageType).toBe(1);
    });

    it("Define right values for mosaics and amount if mosaic transfer enabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.formData.mosaics).toEqual([]);
        expect(ctrl.formData.amount).toBe(1)
    });

    it("Define right values for mosaics and amount if mosaic transfer disabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.isMosaicTransfer = false;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.formData.mosaics).toBe(null);
        expect(ctrl.formData.amount).toBe(0)
    });

    it("Define right values for mosaics and amount if mosaic transfer enabled then disabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Act
        ctrl.isMosaicTransfer = false;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.formData.mosaics).toBe(null);
        expect(ctrl.formData.amount).toBe(0)
    });

    /*it("Can remove mosaic from mosaics array", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();
        ctrl.formData.mosaics.push(nem.model.objects.get("mosaicAttachment"))

        // Act
        ctrl.removeMosaic(0)

        // Assert
        expect(ctrl.formData.mosaics).toEqual([]);
    });*/

    it("Can update current account mosaics", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();

        // Act
        ctrl.updateCurrentAccountMosaics();

        // Assert
        expect(ctrl.currentAccountMosaicData).toEqual(ctrl._DataStore.mosaic.ownedBy[ctrl._Wallet.currentAccount.address]);
    });

    it("Can update current multisig account mosaics", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.formData.isMultisig = true;
        scope.$digest();

        // Act
        ctrl.updateCurrentAccountMosaics();

        // Assert
        if(!DataStore.account.metaData.meta.cosignatoryOf.length) {
            expect(ctrl.currentAccountMosaicData).toEqual([]);
        } else {
            expect(ctrl.currentAccountMosaicData).toEqual(ctrl._DataStore.mosaic.ownedBy[ctrl._DataStore.account.metaData.meta.cosignatoryOf[0].address]);
        }
    });

    /*it("Can attach a mosaic to mosaics array", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Act
        ctrl.selectedMosaic = 'nano:points'
        ctrl.attachMosaic();
        scope.$digest()

        // Assert
        expect(ctrl.formData.mosaics).toEqual([{
            'mosaicId': {
                'namespaceId': 'nano',
                'name': 'points'
            },
            'quantity': 0,
            'gid': 'mos_id_'+ctrl.counter
        }]);
    });*/

    it("Can reset mosaics array if multisig", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();
        ctrl.formData.mosaics = [{
            'mosaicId': {
                'namespaceId': 'nem',
                'name': 'xem'
            },
            'quantity': 0,
            'gid': 'mos_id_0'
        },{
            'mosaicId': {
                'namespaceId': 'nano',
                'name': 'points'
            },
            'quantity': 0,
            'gid': 'mos_id_'+ctrl.counter
        }]

        // Act
        ctrl.formData.isMultisig = true;
         // Done directly in view when click on multisig tab, reset mosaic array
        ctrl.setMosaicTransfer();
        scope.$digest();

        // Assert
        expect(ctrl.formData.mosaics).toEqual([]);
    });


    /*it("Can reset recipient data", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.formData.recipientPublicKey = '0257b05f601ff829fdff84956fb5e3c65470a62375a1cc285779edd5ca3b42f6';
        ctrl.alias = 'nw';
        ctrl.formData.messageType = 2;
        scope.$digest();

        // Act
        ctrl.resetRecipientData();
        scope.$digest();

        // Assert
        expect(ctrl.formData.recipientPublicKey).toEqual('');
        expect(ctrl.alias).toEqual('');
        expect(ctrl.formData.messageType).toBe(1);
    });

    it("Can reset form data", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.formData.recipientPublicKey = '0257b05f601ff829fdff84956fb5e3c65470a62375a1cc285779edd5ca3b42f6';
        ctrl.formData.recipient = 'TBCI2A-67UQZA-KCR6NS-4JWAEI-CEIGEI-M72G3M-VW5S';
        ctrl.formData.messageType = 2;
        scope.$digest();

        // Act
        ctrl.resetData();
        scope.$digest();

        // Assert
        expect(ctrl.formData).toEqual(nem.model.objects.get("transferTransaction"));
        expect(ctrl.common).toEqual(nem.model.objects.get("common")); 
    });*/

    it("Can build correct v1 transfers", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.formData.recipient = 'TBCI2A-67UQZA-KCR6NS-4JWAEI-CEIGEI-M72G3M-VW5S';
        ctrl.formData.message = 'Hello';
        ctrl.formData.amount = 150000;
        scope.$digest();

        // Act
        let entity = ctrl.prepareTransaction();
        scope.$digest();
        // Assert
        expect(entity).toEqual({
            "type": 257,
            "version": -1744830463,
            "signer": "462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce",
            "timeStamp": entity.timeStamp,
            "deadline": entity.deadline,
            "recipient": "TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S",
            "amount": 150000000000,
            "fee": 800000,
            "message": {
                "type": 1,
                "payload": "48656c6c6f"
            },
            "mosaics": null
        });
    });

    it("Can build correct v1 multisig transfers", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        ctrl.formData.recipient = 'TBCI2A-67UQZA-KCR6NS-4JWAEI-CEIGEI-M72G3M-VW5S';
        ctrl.formData.message = 'Hello';
        ctrl.formData.amount = 150000;
        ctrl.formData.isMultisig = true;
        scope.$digest();

        // Act
        let entity = ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(entity).toEqual({
            "type": 4100,
            "version": -1744830463,
            "signer": "462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce",
            "timeStamp": entity.timeStamp,
            "deadline": entity.deadline,
            "fee": 150000,
            "otherTrans": {
                "type": 257,
                "version": -1744830463,
                "signer": "671ca866718ed174a21e593fc1e250837c03935bc79e2daad3bd018c444d78a7",
                "timeStamp": entity.otherTrans.timeStamp,
                "deadline": entity.otherTrans.deadline,
                "recipient": "TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S",
                "amount": 150000000000,
                "fee": 800000,
                "message": {
                    "type": 1,
                    "payload": "48656c6c6f"
                },
                "mosaics": null
            }
        });
    });

    it("Can build correct v2 transfers", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();
        
        // Act
        ctrl.formData.recipient = 'TBCI2A-67UQZA-KCR6NS-4JWAEI-CEIGEI-M72G3M-VW5S';
        ctrl.formData.message = 'Hello';
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();
        ctrl.formData.mosaics = [{
            'mosaicId': {
                'namespaceId': 'nem',
                'name': 'xem'
            },
            'quantity': 10,
            'gid': 'mos_id_0'
        },{
            'mosaicId': {
                'namespaceId': 'nano',
                'name': 'points'
            },
            'quantity': 55,
            'gid': 'mos_id_1'
        }];

        let entity = ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(entity).toEqual({
            "type": 257,
            "version": -1744830462,
            "signer": "462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce",
            "timeStamp": entity.timeStamp,
            "deadline": entity.deadline,
            "recipient": "TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S",
            "amount": 1000000,
            "fee": 750000,
            "message": {
                "type": 1,
                "payload": "48656c6c6f"
            },
            "mosaics": [{
                "mosaicId": {
                    "namespaceId": "nem",
                    "name": "xem"
                },
                "quantity": 10000000,
                "gid": "mos_id_0"
            }, {
                "mosaicId": {
                    "namespaceId": "nano",
                    "name": "points"
                },
                "quantity": 55000,
                "gid": "mos_id_1"
            }]
        });
    });

    it("Can build correct v2 multisig transfers", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
        let ctrl = $controller('TransferTransactionCtrl', { $scope: scope });
        scope.$digest();
        
        // Act
        ctrl.formData.recipient = 'TBCI2A-67UQZA-KCR6NS-4JWAEI-CEIGEI-M72G3M-VW5S';
        ctrl.formData.message = 'Hello';
        ctrl.formData.isMultisig = true;
        scope.$digest();
        ctrl.isMosaicTransfer = true;
        ctrl.setMosaicTransfer();
        scope.$digest();
        ctrl.formData.mosaics = [{
            'mosaicId': {
                'namespaceId': 'nem',
                'name': 'xem'
            },
            'quantity': 12,
            'gid': 'mos_id_0'
        }];

        let entity = ctrl.prepareTransaction();
        scope.$digest();

        // Assert
        expect(entity).toEqual({
            "type": 4100,
            "version": -1744830463,
            "signer": "462ee976890916e54fa825d26bdd0235f5eb5b6a143c199ab0ae5ee9328e08ce",
            "timeStamp": entity.timeStamp,
            "deadline": entity.deadline,
            "fee": nem.model.fees.multisigTransaction,
            "otherTrans": {
                "type": 257,
                "version": -1744830462,
                "signer": "671ca866718ed174a21e593fc1e250837c03935bc79e2daad3bd018c444d78a7",
                "timeStamp": entity.otherTrans.timeStamp,
                "deadline": entity.otherTrans.deadline,
                "recipient": "TBCI2A67UQZAKCR6NS4JWAEICEIGEIM72G3MVW5S",
                "amount": 1000000,
                "fee": 100000,
                "message": {
                    "type": 1,
                    "payload": "48656c6c6f"
                },
                "mosaics": [{
                    "mosaicId": {
                        "namespaceId": "nem",
                        "name": "xem"
                    },
                    "quantity": 12000000,
                    "gid": "mos_id_0"
                }]
            }
        });
    });

});