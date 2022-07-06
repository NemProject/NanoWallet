let testnetAccountData = {
            "meta": {
                "cosignatories": [],
                "cosignatoryOf": [{
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
                }],
                "status": "LOCKED",
                "remoteStatus": "INACTIVE"
            },
            "account": {
                "address": "TAF7BPDV22HCFNRJEWOGLRKBYQF65GBOLQPI5GGO",
                "harvestedBlocks": 0,
                "balance": 54500000,
                "importance": 0,
                "vestedBalance": 28432820,
                "publicKey": "5f8fcdf7cae84b079f08f40c0a6f2da2af3698abeb10de62ed88ccfa1f14e495",
                "label": null,
                "multisigInfo": {}
            }
        }

let testnetNamespaceOwned = {
            "TAF7BPDV22HCFNRJEWOGLRKBYQF65GBOLQPI5GGO": {
                "nano": {
                    "owner": "TAF7BPDV22HCFNRJEWOGLRKBYQF65GBOLQPI5GGO",
                    "fqn": "nano",
                    "height": 547741
                }
            }
        }

let testnetMosaicOwned = {
            "TAF7BPDV22HCFNRJEWOGLRKBYQF65GBOLQPI5GGO": {
                "nano:points": {
                    "quantity": 9999,
                    "mosaicId": {
                        "namespaceId": "nano",
                        "name": "points"
                    }
                },
                "nem:xem": {
                    "quantity": 14514500000,
                    "mosaicId": {
                        "namespaceId": "nem",
                        "name": "xem"
                    }
                }
            },
            "TBUSUKWVVPS7LZO4AF6VABQHY2FI4IIMCJGIVX3X": {
                "nem:xem": {
                    "quantity": 16000000,
                    "mosaicId": {
                        "namespaceId": "nem",
                        "name": "xem"
                    }
                }
            }
        }

let testnetMosaicDefinitionMetaDataPair = {
            "nano:points": {
                "mosaicDefinition": {
                    "creator": "5f8fcdf7cae84b079f08f40c0a6f2da2af3698abeb10de62ed88ccfa1f14e495",
                    "description": "Test",
                    "id": {
                        "namespaceId": "nano2",
                        "name": "points"
                    },
                    "properties": [{
                        "name": "divisibility",
                        "value": "3"
                    }, {
                        "name": "initialSupply",
                        "value": "1000000"
                    }, {
                        "name": "supplyMutable",
                        "value": "true"
                    }, {
                        "name": "transferable",
                        "value": "true"
                    }],
                    "levy": {}
                },
                "supply": 1000000
            },
            "nem:xem": {
                "mosaicDefinition": {
                    "creator": "3e82e1c1e4a75adaa3cba8c101c3cd31d9817a2eb966eb3b511fb2ed45b8e262",
                    "description": "reserved xem mosaic",
                    "id": {
                        "namespaceId": "nem",
                        "name": "xem"
                    },
                    "properties": [{
                        "name": "divisibility",
                        "value": "6"
                    }, {
                        "name": "initialSupply",
                        "value": "8999999999"
                    }, {
                        "name": "supplyMutable",
                        "value": "false"
                    }, {
                        "name": "transferable",
                        "value": "true"
                    }],
                    "levy": {}
                },
                "supply": 8999999999
            }
        }


let mainnetAccountData = {
            "meta": {
                "cosignatories": [],
                "cosignatoryOf": [],
                "status": "LOCKED",
                "remoteStatus": "INACTIVE"
            },
            "account": {
                "address": "NCTIKLMIWKRZC3TRKD5JYZUQHV76LGS3TTSUIXM6",
                "harvestedBlocks": 0,
                "balance": 0,
                "importance": 0,
                "vestedBalance": 0,
                "publicKey": '343648ce70fcaf85a7cb32d1dd76dcacae81303eed1fb0cdfad2847f2482017f',
                "label": null,
                "multisigInfo": {}
            }
        }

let mainnetCosignerAccountData = {
    meta: {
        cosignatories: [],
        cosignatoryOf: [{
            address: "NCC7KUVPQYBTPBABABR5D724CJAOMIA2RJERW3N7",
            harvestedBlocks: 0,
            balance: 16000000,
            importance: 0,
            vestedBalance: 0,
            publicKey: "671ca866718ed174a21e593fc1e250837c03935bc79e2daad3bd018c444d78a7",
            label: null,
            multisigInfo: {
                cosignatoriesCount: 1,
                minCosignatories: 1
            }
        }],
        status: "LOCKED",
        remoteStatus: "INACTIVE"
    },
    account: {
        address: "NC2YRCZB25RHND45HMX7YAZPHYMBKT5VQYMNAOCO",
        harvestedBlocks: 0,
        balance: 0,
        importance: 0,
        vestedBalance: 0,
        publicKey: "405b4ca23f4851d32af03f6d7f8877b1184deed93e37ebd54b974e953629999e",
        label: null,
        multisigInfo: {}
    }
}

let mainnetNamespaceOwned = {
            "NCTIKLMIWKRZC3TRKD5JYZUQHV76LGS3TTSUIXM6": {
                "nano": {
                    "owner": "NCTIKLMIWKRZC3TRKD5JYZUQHV76LGS3TTSUIXM6",
                    "fqn": "nano",
                    "height": 547741
                }
            }
        }

let mainnetMosaicOwned = {
            "NCTIKLMIWKRZC3TRKD5JYZUQHV76LGS3TTSUIXM6": {
                "nano:points": {
                    "quantity": 9999,
                    "mosaicId": {
                        "namespaceId": "nano",
                        "name": "points"
                    }
                },
                "nem:xem": {
                    "quantity": 0,
                    "mosaicId": {
                        "namespaceId": "nem",
                        "name": "xem"
                    }
                }
            }
        }

let mainnetMosaicDefinitionMetaDataPair = {
            "nano:points": {
                "mosaicDefinition": {
                    "creator": "5f8fcdf7cae84b079f08f40c0a6f2da2af3698abeb10de62ed88ccfa1f14e495",
                    "description": "Test",
                    "id": {
                        "namespaceId": "nano2",
                        "name": "points"
                    },
                    "properties": [{
                        "name": "divisibility",
                        "value": "3"
                    }, {
                        "name": "initialSupply",
                        "value": "1000000"
                    }, {
                        "name": "supplyMutable",
                        "value": "true"
                    }, {
                        "name": "transferable",
                        "value": "true"
                    }],
                    "levy": {}
                },
                "supply": 1000000
            },
            "nem:xem": {
                "mosaicDefinition": {
                    "creator": "3e82e1c1e4a75adaa3cba8c101c3cd31d9817a2eb966eb3b511fb2ed45b8e262",
                    "description": "reserved xem mosaic",
                    "id": {
                        "namespaceId": "nem",
                        "name": "xem"
                    },
                    "properties": [{
                        "name": "divisibility",
                        "value": "6"
                    }, {
                        "name": "initialSupply",
                        "value": "8999999999"
                    }, {
                        "name": "supplyMutable",
                        "value": "false"
                    }, {
                        "name": "transferable",
                        "value": "true"
                    }],
                    "levy": {}
                },
                "supply": 8999999999
            }
        }

module.exports = {
    testnetAccountData,
    testnetNamespaceOwned,
    testnetMosaicOwned,
    testnetMosaicDefinitionMetaDataPair,
    mainnetAccountData,
    mainnetCosignerAccountData,
    mainnetNamespaceOwned,
    mainnetMosaicOwned,
    mainnetMosaicDefinitionMetaDataPair
}