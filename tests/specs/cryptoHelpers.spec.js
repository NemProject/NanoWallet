import nem from 'nem-sdk';
import CryptoHelpers from '../../src/app/utils/CryptoHelpers';

describe('CryptoHelpers tests', function() {

    it("Can generate bip32 child key (test 1)", function(done) {
        // Arrange:
        let privateKey = "6809a9582cd395aa8803bbce10449c9819e34d3afa1cb4f4e2df52fb37864ccb";
        let password = "TestTest";
        let index = 0;
        let expectedChildPrivateKey = "2a91e1d5c110a8d0105aad4683f962c2a56663a3cad46666b16d243174673d90";

        // Act:
        CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {
            let childPrivateKey = data.privateKey;

            // Assert:
            expect(childPrivateKey).toEqual(expectedChildPrivateKey);

            done();
        });
    });

    it("Can generate bip32 child key (test 2)", function(done) {
        // Arrange:
        let privateKey = "881f27edee3bb2c01da1d37de124965f60b414d02718d8ec9128ef6c129ea61f";
        let password = "Test";
        let index = 1;
        let expectedChildPrivateKey = "ad4acecb07b77f8a27b900a5a03cdb04d6bcf1f097e57a39e3f668d80cafdc35";

        // Act:
        CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {
            let childPrivateKey = data.privateKey;

            // Assert:
            expect(childPrivateKey).toEqual(expectedChildPrivateKey);

            done();
        });
    });

    it("Can generate bip32 child key (test 3)", function(done) {
        // Arrange:
        let privateKey = "881f27edee3bb2c01da1d37de124965f60b414d02718d8ec9128ef6c129ea61f";
        let password = "Test";
        let index = 0;
        let expectedChildPrivateKey = "2e1e8733ca4fbce4c8697f31243366e50d2d552cd7be6fab591bb389f31a5c2b";

        // Act:
        CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {
            let childPrivateKey = data.privateKey;

            // Assert:
            expect(childPrivateKey).toEqual(expectedChildPrivateKey);

            done();
        });
    });

    describe('Bip32 edge-cases', function() {

        it("Bip32 return different private key if different password", function(done) {
            // Arrange:
            let privateKey = "881f27edee3bb2c01da1d37de124965f60b414d02718d8ec9128ef6c129ea61f";
            let password = "Testabc";
            let index = 0;
            let expectedChildPrivateKey = "e52e391a94c658f25055e6ad112d9f010567ffb40992b9c7cdbb2df52fc2b2c0";

            // Act:
            CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {
                let childPrivateKey = data.privateKey;

                // Assert:
                expect(childPrivateKey).toEqual(expectedChildPrivateKey);

                done();
            });
        });

        it("Bip32 return error if no private key", function(done) {
            // Arrange:
            let privateKey = "";
            let password = "TestTest";
            let index = 0;

            // Act:
            CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {},
                (err) => {
                    // Assert:
                    expect(err).toBeDefined();
                    done();
                });
        });

        it("Bip32 return error if private key is invalid", function(done) {
            // Arrange:
            let privateKey = "x809a9582cd395aa8803bbce10449c9819e34d3afa1cb4f4e2df52fb37864ccp";
            let password = "TestTest";
            let index = 0;

            // Act:
            CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {},
                (err) => {
                    // Assert:
                    expect(err).toBeDefined();
                    done();
                });
        });

        it("Bip32 return error if no password", function(done) {
            // Arrange:
            let privateKey = "6809a9582cd395aa8803bbce10449c9819e34d3afa1cb4f4e2df52fb37864ccb";
            let password = "";
            let index = 0;

            // Act:
            let result = CryptoHelpers.generateBIP32Data(privateKey, password, index, nem.model.network.data.mainnet.id).then((data) => {},
                (err) => {
                    // Assert:
                    expect(err).toBeDefined();
                    done();
                });
        });

    });
});