function Characteristic(gattip, peripheral, service, uuid) {
    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Descriptor = require("./descriptor.js").Descriptor;
    }

    var _gattip = gattip;
    var _peripheral = peripheral;
    var _service = service;

    this.uuid = uuid;
    this.descriptors = {};
    this.properties = {};
    this.value = '';
    this.characteristicName = '';
    this.isNotifying = false;

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    if (peripheral.characteristicNames && peripheral.characteristicNames[uuid]) {
        var uuidObj = peripheral.characteristicNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.characteristicName = uuidObj.name;
        }
    }


    this.discoverDescriptors = function (callback) {
        if (callback) this.ondiscoverDescriptors = callback;

        if (this.descriptors && Object.size(this.descriptors) > 0) {
            _gattip.ondiscoverDescriptors(_peripheral, _service, this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            _gattip.write(C.kGetDescriptors, params);
        }
    };

    this.ondiscoverDescriptors = function (params) {
        for (var index in params[C.kDescriptors]) {
            var descriptorUUID = params[C.kDescriptors][index][C.kDescriptorUUID];
            var descriptor = this.descriptors[descriptorUUID];
            if (!descriptor) {
                descriptor = new Descriptor(_gattip, _peripheral, _service, this, descriptorUUID);
            }
            
            var props = params[C.kDescriptors][index][C.kProperties];
            for (var apindex in C.AllProperties) {
                descriptor.properties[C.AllProperties[apindex]] = {
                    enabled: (props >> apindex) & 1,
                    name: C.AllProperties[apindex]
                };
            }

            this.descriptors[descriptorUUID] = descriptor;
        }
    };

    this.read = function (callback) {
        if (callback) this.onread = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.onread = function (params) {
        this.isNotifying = params[C.kIsNotifying];
        this.value = params[C.kValue];
    };

    this.write = function (data, callback) {
        var restype;
        if (this.properties["WriteWithoutResponse"].enabled == 1 || this.properties["Indicate"].enabled == 1) {
            restype = C.kWriteWithoutResponse;
        } else {
            restype = C.kWriteResponse;
        }
        this.writeWithResType(data, restype, callback);
    };

    this.writeWithResType = function (data, restype, callback) {
        if (callback) this.onwrite = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        params[C.kValue] = data;
        params[C.kWriteType] = restype;
        _gattip.write(C.kWriteCharacteristicValue, params);
    };

    this.onwrite = function (params, error) {
    };

    this.notify = function (value, callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        params[C.kValue] = value;
        this.isNotifying = value;

        _gattip.write(C.kSetValueNotification, params);
    };

    this.indicate = function (callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;

        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.broadcast = function (callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;

        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.discoverDescriptorsRequest = function () {
        if (_gattip.discoverDescriptorsRequest) {
            _gattip.discoverDescriptorsRequest(_peripheral, _service, this);
        } else {
            throw Error('discoverDescriptorsRequest method not implemented by server');
        }
    };

    this.discoverDescriptorsResponse = function (error) {
        if (!error) {
            params = {};
            var discArray = [];

            for (var uuid in this.descriptors) {
                var obj = {};
                obj[C.kDescriptorUUID] = this.descriptors[uuid].uuid;
                obj[C.kProperties] = this.descriptors[uuid].properties;
                obj[C.kValue] = this.descriptors[uuid].value;
                obj[C.kIsNotifying] = this.descriptors[uuid].isNotifying;
                discArray.push(obj);
            }
            params[C.kDescriptors] = discArray;
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;

            _gattip.write(C.kGetDescriptors, params);
        } else {
            _gattip.write(C.kGetCharacteristics, kError32603, error);
        }
    };

    this.readCharacteristicValueRequest = function (params) {
        if (_gattip.readCharacteristicValueRequest) {
            _gattip.readCharacteristicValueRequest(_peripheral, _service, this);
        } else {
            throw Error('readCharacteristicValueRequest method not implemented by server');
        }
    };

    this.writeCharacteristicValueRequest = function (params) {
        if (_gattip.writeCharacteristicValueRequest) {
            _gattip.writeCharacteristicValueRequest(_peripheral, _service, this, params[C.kValue]);
        } else {
            throw Error('writeCharacteristicValueRequest method not implemented by server');
        }
    };

    this.enableNotificationsRequest = function (params) {
        if (_gattip.enableNotificationsRequest) {
            _gattip.enableNotificationsRequest(_peripheral, _service, this, params[C.kValue]);
        } else {
            throw Error('enableNotificationsRequest method not implemented by server');
        }
    };

    this.respondToReadRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kGetCharacteristicValue, C.kError32603, 'Failed to read the Characteristic value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            params[C.kValue] = this.value;
            params[C.kIsNotifying] = this.isNotifying;

            _gattip.write(C.kGetCharacteristicValue, params);
        }
    };

    this.respondToWriteRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kWriteCharacteristicValue, C.kError32603, 'Failed to write the Characteristic value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            params[C.kValue] = this.value;

            _gattip.write(C.kWriteCharacteristicValue, params);
        }
    };

    function respondNotify(self) {

        params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = self.uuid;
        params[C.kIsNotifying] = self.isNotifying;
        params[C.kValue] = self.value;

        _gattip.write(C.kSetValueNotification, params);
    }

    this.respondWithNotification = function (value) {
        this.value = value;
        respondNotify(this);
    };

    this.respondToChangeNotification = function (isNotifying) {
        this.isNotifying = isNotifying;
        respondNotify(this);
    };

    this.addDescriptor = function (descriptorUUID) {
        var descriptor = new Descriptor(_gattip, _peripheral, _service, this, descriptorUUID);
        this.descriptors[descriptor.uuid] = descriptor;

        return descriptor;
    };

    this.updateValue = function (value) {
        this.value = value;
        return this;
    };

    this.updateProperties = function (properties) {
        this.properties = properties;
        return this;
    };

}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Characteristic = Characteristic;
}
var C = {
    kError: "error",
    kCode: "code",
    kMessageField: "message",
    kResult: "result",
    kIdField: "id",
    kConfigure: "aa",
    kScanForPeripherals: "ab",
    kStopScanning: "ac",
    kConnect: "ad",
    kDisconnect: "ae",
    kCentralState: "af",
    kGetConnectedPeripherals: "ag",
    kGetPerhipheralsWithServices: "ah",
    kGetPerhipheralsWithIdentifiers: "ai",
    kGetServices: "ak",
    kGetIncludedServices: "al",
    kGetCharacteristics: "am",
    kGetDescriptors: "an",
    kGetCharacteristicValue: "ao",
    kGetDescriptorValue: "ap",
    kWriteCharacteristicValue: "aq",
    kWriteDescriptorValue: "ar",
    kSetValueNotification: "as",
    kGetPeripheralState: "at",
    kGetRSSI: "au",
    kInvalidatedServices: "av",
    kPeripheralNameUpdate: "aw",
    kMessage: "zz",
    kCentralUUID: "ba",
    kPeripheralUUID: "bb",
    kPeripheralName: "bc",
    kPeripheralUUIDs: "bd",
    kServiceUUID: "be",
    kServiceUUIDs: "bf",
    kPeripherals: "bg",
    kIncludedServiceUUIDs: "bh",
    kCharacteristicUUID: "bi",
    kCharacteristicUUIDs: "bj",
    kDescriptorUUID: "bk",
    kServices: "bl",
    kCharacteristics: "bm",
    kDescriptors: "bn",
    kProperties: "bo",
    kValue: "bp",
    kState: "bq",
    kStateInfo: "br",
    kStateField: "bs",
    kWriteType: "bt",
    kRSSIkey: "bu",
    kIsPrimaryKey: "bv",
    kIsBroadcasted: "bw",
    kIsNotifying: "bx",
    kShowPowerAlert: "by",
    kIdentifierKey: "bz",
    kScanOptionAllowDuplicatesKey: "b0",
    kScanOptionSolicitedServiceUUIDs: "b1",
    kAdvertisementDataKey: "b2",
    kCBAdvertisementDataManufacturerDataKey: "b3",
    kCBAdvertisementDataServiceUUIDsKey: "b4",
    kCBAdvertisementDataServiceDataKey: "b5",
    kCBAdvertisementDataOverflowServiceUUIDsKey: "b6",
    kCBAdvertisementDataSolicitedServiceUUIDsKey: "b7",
    kCBAdvertisementDataIsConnectable: "b8",
    kCBAdvertisementDataTxPowerLevel: "b9",
    kPeripheralBtAddress: "c1",
    kRawAdvertisementData: "c2",
    kScanRecord: "c3",
    kCBCentralManagerRestoredStatePeripheralsKey: "da",
    kCBCentralManagerRestoredStateScanServicesKey: "db",
    kWriteWithResponse: "cc",
    kWriteWithoutResponse: "cd",
    kNotifyOnConnection: "ce",
    kNotifyOnDisconnection: "cf",
    kNotifyOnNotification: "cg",
    kDisconnected: "ch",
    kConnecting: "ci",
    kConnected: "cj",
    kUnknown: "ck",
    kResetting: "cl",
    kUnsupported: "cm",
    kUnauthorized: "cn",
    kPoweredOff: "co",
    kPoweredOn: "cp",
    kErrorPeripheralNotFound: "-32001",
    kErrorServiceNotFound: "-32002",
    kErrorCharacteristicNotFound: "-32003",
    kErrorDescriptorNotFound: "-32004",
    kErrorPeripheralStateIsNotValid: "-32005",
    kErrorNoServiceSpecified: "-32006",
    kErrorNoPeripheralIdentiferSpecified: "-32007",
    kErrorStateRestorationNotValid: "-32008",
    kInvalidRequest: "-32600",
    kMethodNotFound: "-32601",
    kInvalidParams: "-32602",
    kError32603: "-32603",
    kParseError: "-32700",
    kGAP_ADTYPE_FLAGS: "01",
    kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID: "02",
    kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID: "03",
    kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID: "04",
    kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID: "05",
    kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID: "06",
    kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID: "07",
    kGAP_ADTYPE_POWER_LEVEL: "0A",
    kGAP_ADTYPE_MANUFACTURER_SPECIFIC: "FF",
    kGAP_ADTYPE_16BIT_SERVICE_DATA: "16",
    id: 1,
    authenticate: 'authenticate',
    AllProperties: ["Broadcast", "Read", "WriteWithoutResponse", "Write", "Notify", "Indicate", "AuthenticatedSignedWrites", "ExtendedProperties", "NotifyEncryptionRequired", "IndicateEncryptionRequired"]
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.C = C;
}function Descriptor(gattip, peripheral, service, characteristic, uuid) {
    var _gattip = gattip;
    var _peripheral = peripheral;
    var _service = service;
    var _characteristic = characteristic;
    this.uuid = uuid;
    this.value = "";
    this.descriptorName = '';
    this.properties = {};
    this.isNotifying = false;

    if (peripheral.descriptorNames && peripheral.descriptorNames[uuid]) {
        var uuidObj = peripheral.descriptorNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.descriptorName = uuidObj.name;
        }
    }

    this.updateValue = function (value) {
        this.value = value;
        return this;
    };

    this.updateProperties = function (properties) {
        this.properties = properties;
        return this;
    };

    this.read = function (callback) {
        if (callback) this.onread = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = _characteristic.uuid;
        params[C.kDescriptorUUID] = this.uuid;
        _gattip.write(C.kGetDescriptorValue, params);
    };

    this.onread = function (params) {
        this.isNotifying = params[C.kIsNotifying];
        this.value = params[C.kValue];
    };

    this.write = function (data, callback) {
        if (callback) this.onwrite = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = _characteristic.uuid;
        params[C.kDescriptorUUID] = this.uuid;
        params[C.kValue] = data;
        _gattip.write(C.kWriteDescriptorValue, params);
    };

    this.onwrite = function (params) {
    };

    this.readDescriptorValueRequest = function (params) {
        if (_gattip.readDescriptorValueRequest) {
            _gattip.readDescriptorValueRequest(_peripheral, _service, _characteristic, this);
        } else {
            throw Error('readDescriptorValueRequest method not implemented by server');
        }
    };

    this.writeDescriptorValueRequest = function (params) {
        if (_gattip.writeDescriptorValueRequest) {
            _gattip.writeDescriptorValueRequest(_peripheral, _service, _characteristic, this, params[C.kValue]);
        } else {
            throw Error('writeDescriptorValueRequest method not implemented by server');
        }
    };

    this.respondToReadDescriptorValueRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kGetDescriptorValue, C.kError32603, 'Failed to read the descriptor value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = _characteristic.uuid;
            params[C.kDescriptorUUID] = this.uuid;
            params[C.kValue] = this.value;
            params[C.kIsNotifying] = this.isNotifying;

            _gattip.write(C.kGetDescriptorValue, params);
        }
    };

    this.respondToWriteDescriptorValueRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kWriteDescriptorValue, C.kError32603, 'Failed to write the descriptor value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = _characteristic.uuid;
            params[C.kDescriptorUUID] = this.uuid;
            params[C.kValue] = this.value;

            _gattip.write(C.kWriteDescriptorValue, params);
        }
    };


}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Descriptor = Descriptor;
}

function GattIpServer() {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Peripheral = require("./peripheral.js").Peripheral;
        WebSocket = require('websocket').w3cwebsocket;
    }

    var server;
    this.state = C.kUnknown;
    this.peripherals = {};

    this.init = function (url, callback) {
        if (callback) this.oninit = callback;

        this.socket = new WebSocket(url);

        this.socket.onopen = function () {
            this.initWithServer(this.socket);
            if (this.oninit) {
                this.oninit();
            }
        }.bind(this);
    };

    this.initWithServer = function (_server) {
        server = _server;

        if (!server.send) {
            throw Error('server must implement the send method');
        }
        server.onmessage = this.processMessage.bind(this);

        if (!server.onclose) {
            server.onclose = function () {
                console.log('socket is closed')
            };
        }
        if (!server.onerror) {
            server.onerror = function (error) {
                console.log('socket is onerror, onerror' + error);
            };
        }
        if (!server.error) {
            server.onerror = function (error) {
                console.log('socket is error, error' + error);
            };
        }
    };

    this.processMessage = function (mesg) {
        var message = JSON.parse(mesg.data);
        var params, peripheral, service, characteristic, descriptor, gObject;

        if ((typeof message === 'undefined') || (!message)) {
            params = {};
            params[C.kCode] = C.kInvalidRequest;
            this.write(C.kError, params);
            return;
        }

        if (message.result && message.result == C.kMessage) {
            this.onauthenticate(message.params, message.error);
            return;
        }

        if (message.error) {
            this.sendErrorResponse(message.method, C.kInvalidRequest, 'Error in the Request');
            return;
        }

        //TODO: It is better to remove the devices, if length is going to infinite, based on like recently used..
        //TODO: General comment - you should not be tracking peripherals/services/etc.
        //  Burden the gateway to do this and respond accordingly TO YOU with appropriate error
        //  Each gateway/stack tracks peripherals/services/etc. so you don't have to
        //TODO: General comment - ensure that the library can deal with blank strings and arrays that are nulls or undefined.
        // Address/convert missing values accordingly
        //TODO: General comment - The purpose of this module is to parse AND VERIFY each argument passed to it in order to protect
        // both sides -- the client and the server -- from the other misbehaving, but not going too far to ensure
        // that correct messages are sent in correct sequence. You are stateless, and you don't care if a client wants to connect to an undiscovered
        // service
        // You should do minimal message integrity checks. Examples that this code fails at:
        //      - Address in connect request is blank - server crashes
        //      - Scan response data is sent as an array from the server - client crashes because it expects a hex string
        //TODO: Ensure that no message sent by the client can crash you. This is also a hack attack vector, so you ought to not crash on bad messages

        //TODO: Consider putting this in an associative array, rather than a switch
        switch (message.method) {
            case C.kConfigure:
                this.configureRequest(message.params);
                break;
            case C.kScanForPeripherals:
                this.scanRequest(message.params);
                break;
            case C.kStopScanning:
                this.stopScanRequest(message.params);
                break;
            case C.kConnect:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    this.connectRequest(gObject.peripheral);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kDisconnect:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    this.disconnectRequest(gObject.peripheral);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kCentralState:
                this.centralStateRequest(message.params);
                break;
            case C.kGetServices:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.peripheral.discoverServicesRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetIncludedServices:
                console.log("kGetIncludedServices event"); //TODO
                break;
            case C.kInvalidatedServices:
                console.log("kInvalidatedServices event"); //TODO
                break;
            case C.kGetCharacteristics:
                try {
                    gObject = this.getObjects('S', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.service.discoverCharacteristicsRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptors:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.discoverDescriptorsRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetCharacteristicValue:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.readCharacteristicValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteCharacteristicValue:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.writeCharacteristicValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kSetValueNotification:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.isNotifying = message.params[C.kValue];
                    gObject.characteristic.enableNotificationsRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptorValue:
                try {
                    gObject = this.getObjects('D', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.descriptor.readDescriptorValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteDescriptorValue:
                try {
                    gObject = this.getObjects('D', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.descriptor.writeDescriptorValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;

            default:
                console.log('invalid request' + message.method);
                this.sendErrorResponse(message.method, C.kInvalidRequest, 'Request not handled by server');
                return;
        }
        this.message = message;
    };


    this.getObjects = function (type, peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID) {

        var resultObj = {};

        resultObj.peripheral = this.peripherals[peripheralUUID];
        if (resultObj.peripheral) {
            if (type === 'P') {
                return resultObj;
            }
            resultObj.service = resultObj.peripheral.services[serviceUUID];
            if (resultObj.service) {
                if (type === 'S') {
                    return resultObj;
                }
                resultObj.characteristic = resultObj.service.characteristics[characteristicUUID];
                if (resultObj.characteristic) {
                    if (type === 'C') {
                        return resultObj;
                    }
                    resultObj.descriptor = resultObj.characteristic.descriptors[descriptorUUID];
                    if (resultObj.descriptor) {
                        return resultObj;
                    } else {
                        this.sendErrorResponse(message.method, C.kErrorDescriptorNotFound, 'Descriptor not found');
                        throw Error('Descriptor not found');
                    }
                } else {
                    this.sendErrorResponse(message.method, C.kErrorCharacteristicNotFound, 'Characteristic not found');
                    throw Error('Characteristic not found');
                }
            } else {
                this.sendErrorResponse(message.method, C.kErrorServiceNotFound, 'Service not found');
                throw Error('Service not found');
            }
        } else {
            this.sendErrorResponse(message.method, C.kErrorPeripheralNotFound, 'Peripheral not found');
            throw Error('Peripheral not found');
        }

    };

    this.sendErrorResponse = function (method, errorId, errMessage) {
        var error = {};
        params = {};
        error[C.kCode] = errorId;
        error[C.kMessageField] = errMessage;
        params[C.kError] = error;
        this.write(method, undefined, undefined, error);
    };

    this.authenticate = function (token) {
        this.send(JSON.stringify({
            type: C.authenticate,
            access_token: token
        }));
    };

    this.configureRequest = function () {
        console.error('configureRequest method not implemented by server');
    };

    this.configureResponse = function (error) {
        if (!error) {
            this.write(C.kConfigure);
        } else {
            this.write(C.kConfigure, error);
        }
    };

    this.centralStateRequest = function () {
        console.error('centralStateRequest method not implemented by server');
    };

    this.centralStateResponse = function (state, error) {
        if (!error) {
            params = {};
            params[C.kState] = state;
            this.write(C.kCentralState, params);
        } else {
            this.write(C.kCentralState, error);
        }
    };

    this.scanRequest = function () {
        console.error('scanRequest method not implemented by server');
    };

    this.scanResponse = function (name, uuid, addr, rssi, advertisementData, manufacturerData) {
        params = {};
        var advData = {};

        advData[C.kRawAdvertisementData] = advertisementData;
        params[C.kPeripheralName] = name;
        params[C.kPeripheralUUID] = uuid;
        params[C.kPeripheralBtAddress] = addr;
        params[C.kRSSIkey] = rssi;
        params[C.kAdvertisementDataKey] = advData;
        params[C.kScanRecord] = manufacturerData;

        this.write(C.kScanForPeripherals, params);
    };

    this.stopScanRequest = function () {
        console.error('stopScanRequest method not implemented by server');
    };

    this.stopScanResponse = function (error) {
        if (!error) {
            this.write(C.kStopScanning);
        } else {
            this.write(C.kStopScanning, error);
        }

    };

    this.connectRequest = function () {
        console.error('connectRequest method not implemented by server');
    };

    this.connectResponse = function (peripheral, error) {
        var peripheral_db = {};
        peripheral_db[C.kPeripheralUUID] = peripheral.uuid;
        peripheral_db[C.kPeripheralName] = peripheral.name;

        var service_db = {};
        service_db = getServiceJsonFromPeripheralObject(peripheral);
        peripheral_db[C.kServices] = service_db;

        if (!error) {
            this.write(C.kConnect, peripheral_db);
        } else {
            this.write(C.kConnect, error);
        }
    };

    this.disconnectRequest = function () {
        console.error('disconnectRequest method not implemented by server');
    };

    this.disconnectResponse = function (peripheral, error) {
        if (!error) {
            params = {};
            params[C.kPeripheralUUID] = peripheral.uuid;
            params[C.kPeripheralName] = peripheral.name;

            this.write(C.kDisconnect, params);
        } else {
            this.write(C.kDisconnect, error);
        }
    };

    this.write = function (result, params, id, error) {
        var mesg = {};
        mesg.jsonrpc = "2.0";
        mesg.result = result;
        mesg.params = params;
        mesg.error = error;
        mesg.id = C.id.toString();
        C.id += 1;
        this.send(JSON.stringify(mesg));
    };

    this.send = function (mesg) {
        if (!server) {
            this.onerror("not connected");
            return;
        }
        if (server.readyState !== 1) {
            console.log('Socket is CLOSED');
            return;
        }
        server.send(mesg);
    };

    this.close = function (callback) {
        if (server) {
            server.close();
        }
    };

    function getServiceJsonFromPeripheralObject(myPeripheral) {
        var service_db = {};

        if (myPeripheral && myPeripheral.services) {
            for (var uuid in myPeripheral.services) {
                var temp_service = {};
                temp_service[C.kServiceUUID] = uuid;
                temp_service[C.kIsPrimaryKey] = myPeripheral.services[uuid].isPrimary;
                temp_service[C.kCharacteristics] = getCharacteristicJsonFromServiceObject(myPeripheral.services[uuid]);

                service_db[uuid] = temp_service;
            }
        }

        return service_db;
    }

    function getCharacteristicJsonFromServiceObject(myService) {
        var characteristic_db = {};

        if (myService && myService.characteristics) {
            for (var uuid in myService.characteristics) {
                var temp_characteristic = {};
                temp_characteristic[C.kCharacteristicUUID] = uuid;
                temp_characteristic[C.kValue] = myService.characteristics[uuid].value;
                temp_characteristic[C.kProperties] = myService.characteristics[uuid].properties;
                temp_characteristic[C.kIsNotifying] = myService.characteristics[uuid].isNotifying;
                temp_characteristic[C.kDescriptors] = getDescriptorJsonFromCharacteristicObject(myService.characteristics[uuid]);

                characteristic_db[uuid] = temp_characteristic;
            }
        }

        return characteristic_db;
    }

    function getDescriptorJsonFromCharacteristicObject(myCharacteristic) {
        var descriptor_db = {};

        if (myCharacteristic && myCharacteristic.descriptors) {
            for (var uuid in myCharacteristic.descriptors) {
                var temp_descriptor = {};
                temp_descriptor[C.kDescriptorUUID] = uuid;
                temp_descriptor[C.kValue] = myCharacteristic.descriptors[uuid].value;
                temp_descriptor[C.kProperties] = myCharacteristic.descriptors[uuid].properties;
                temp_descriptor[C.kIsNotifying] = myCharacteristic.descriptors[uuid].isNotifying;

                descriptor_db[uuid] = temp_descriptor;
            }
        }

        return descriptor_db;
    }

    this.addPeripheral = function (name, uuid, addr, rssi, addata, scanData) {
        var peripheral = new Peripheral(this, name, uuid, addr, rssi, addata, scanData);
        this.peripherals[peripheral.uuid] = peripheral;

        return peripheral;
    };

    /* The following define the flags that are valid with the SecurityProperties */
    this.GATM_SECURITY_PROPERTIES_NO_SECURITY = 0x00000000;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_WRITE = 0x00000001;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_WRITE = 0x00000002;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_READ = 0x00000004;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_READ = 0x00000008;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_SIGNED_WRITES = 0x00000010;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000020;

    /* The following define the flags that are valid with the CharacteristicProperties */
    this.GATM_CHARACTERISTIC_PROPERTIES_BROADCAST = 0x00000001;
    this.GATM_CHARACTERISTIC_PROPERTIES_READ = 0x00000002;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE_WO_RESP = 0x00000004;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE = 0x00000008;
    this.GATM_CHARACTERISTIC_PROPERTIES_NOTIFY = 0x00000010;
    this.GATM_CHARACTERISTIC_PROPERTIES_INDICATE = 0x00000020;
    this.GATM_CHARACTERISTIC_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000040;
    this.GATM_CHARACTERISTIC_PROPERTIES_EXT_PROPERTIES = 0x00000080;

    /* The following define the flags that are valid with the DescriptorProperties */
    this.GATM_DESCRIPTOR_PROPERTIES_READ = 0x00000001;
    this.GATM_DESCRIPTOR_PROPERTIES_WRITE = 0x00000002;

}


if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.GattIpServer = GattIpServer;
}function GATTIP() {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Peripheral = require("./peripheral.js").Peripheral;
        WebSocket = require('websocket').w3cwebsocket;
    }

    var client;
    this.peripherals = {};

    this.init = function (url, callback) {

        if (callback) this.oninit = callback;

        this.socket = new WebSocket(url);

        this.socket.onopen = function () {
            this.initWithClient(this.socket);
            if (this.oninit) {
                this.oninit();
            }
        }.bind(this);
    };

    this.initWithClient = function (_client) {
        this.state = C.kUnknown;
        client = _client;
        client.onmessage = this.processMessage.bind(this);
    };

    this.processMessage = function (mesg) {
        var response = JSON.parse(mesg.data);
        var peripheral, service, characteristic, descriptor, gObject = {};

        switch (response.result) {
            case C.kConfigure:
                this.onconfigure(response.params, response.error);
                break;
            case C.kScanForPeripherals:
                if (response.params && response.params[C.kPeripheralUUID])
                    peripheral = this.peripherals[response.params[C.kPeripheralUUID]];
                if (!response.error) {
                    peripheral = new Peripheral(this,
                        response.params[C.kPeripheralName],
                        response.params[C.kPeripheralUUID],
                        response.params[C.kPeripheralBtAddress],
                        response.params[C.kRSSIkey],
                        response.params[C.kAdvertisementDataKey],
                        response.params[C.kScanRecord]);

                    this.peripherals[response.params[C.kPeripheralUUID]] = peripheral;
                }
                this.onscan(peripheral, response.error);
                break;
            case C.kStopScanning:
                this.onstopScan(response.error);
                break;
            case C.kConnect:
                if (response.params && response.params[C.kPeripheralUUID])
                    peripheral = this.peripherals[response.params[C.kPeripheralUUID]];
                if (!response.error) {
                    if (peripheral) {
                        peripheral.ondiscoverServices(response.params, response.error);
                        for (var suuid in response.params[C.kServices]) {
                            service = peripheral.services[suuid];
                            if (service) {
                                service.ondiscoverCharacteristics(response.params[C.kServices][suuid], response.error);
                                for (var cuuid in service.characteristics) {
                                    characteristic = service.characteristics[cuuid];
                                    if (characteristic) {
                                        characteristic.ondiscoverDescriptors(response.params[C.kServices][service.uuid][C.kCharacteristics][cuuid], response.error);
                                    } else {
                                        this.onerror("Characteristic not found");
                                    }
                                }
                            } else {
                                this.onerror("Service not found");
                            }
                        }
                        peripheral.onconnect();
                    } else {
                        this.onerror("Peripheral not found");
                    }
                } else {
                    if (peripheral)
                        peripheral.onconnect(response.error);
                }
                this.onconnect(peripheral, response.error);
                break;
            case C.kDisconnect:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.ondisconnect(response.error);
                    }
                }
                this.ondisconnect(gObject.peripheral, response.error);
                break;
            case C.kCentralState:
                this.state = response.params[C.kState];
                this.onstate(response.params[C.kState], response.error);
                break;
            case C.kGetServices:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.ondiscoverServices(response.params, response.error);
                    }
                }
                this.ondiscoverServices(gObject.peripheral, response.error);
                break;
            case C.kGetCharacteristics:
                if (response.params) {
                    gObject = this.getObjects('S', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.service) {
                        gObject.service.ondiscoverCharacteristics(response.params, response.error);
                    }
                }
                this.ondiscoverCharacteristics(gObject.peripheral, gObject.service, response.error);
                break;
            case C.kGetDescriptors:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.ondiscoverDescriptors(response.params, response.error);
                    }
                }
                this.ondiscoverDescriptors(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kGetCharacteristicValue:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.onread(response.params, response.error);
                    }
                }
                this.onupdateValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kWriteCharacteristicValue:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.onwrite(response.params, response.error);
                    }
                }
                this.onwriteValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kSetValueNotification:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.isNotifying = response.params[C.kIsNotifying];
                        gObject.characteristic.value = response.params[C.kValue];
                    }
                }
                this.onupdateValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kGetDescriptorValue:
                if (response.params) {
                    gObject = this.getObjects('D', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.descriptor) {
                        gObject.descriptor.onread(response.params, response.error);
                    }
                }
                this.ondescriptorRead(gObject.peripheral, gObject.service, gObject.characteristic, gObject.descriptor, response.error);
                break;
            case C.kWriteDescriptorValue:
                if (response.params) {
                    gObject = this.getObjects('D', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.descriptor) {
                        gObject.descriptor.onwrite(response.params, response.error);
                    }
                }
                this.ondescriptorWrite(gObject.peripheral, gObject.service, gObject.characteristic, gObject.descriptor, response.error);
                break;
            case C.kGetRSSI:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.name = response.params[C.kPeripheralName];
                        gObject.peripheral.rssi = response.params[C.kRSSIkey];
                    }
                }
                this.onupdateRSSI(gObject.peripheral, response.error);
                break;
            case C.kPeripheralNameUpdate:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.name = response.params[C.kPeripheralName];
                        gObject.peripheral.rssi = response.params[C.kRSSIkey];
                    }
                }
                this.onupdateRSSI(gObject.peripheral, response.error);
                break;
            case C.kMessage:
                this.onMessage(response.params, response.error);
                break;
            default:
                this.onerror('invalid response');

                this.message = response;
        }
    };

    this.getObjects = function (type, peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID) {

        var resultObj = {};

        resultObj.peripheral = this.peripherals[peripheralUUID];
        if (resultObj.peripheral) {
            if (type === 'P') {
                return resultObj;
            }
            resultObj.service = resultObj.peripheral.services[serviceUUID];
            if (resultObj.service) {
                if (type === 'S') {
                    return resultObj;
                }
                resultObj.characteristic = resultObj.service.characteristics[characteristicUUID];
                if (resultObj.characteristic) {
                    if (type === 'C') {
                        return resultObj;
                    }
                    resultObj.descriptor = resultObj.characteristic.descriptors[descriptorUUID];
                    if (resultObj.descriptor) {
                        if (type === 'D') {
                            return resultObj;
                        } else {
                            console.log('getObjects: Type is not mentioned');
                        }
                    } else {
                        this.onerror('Descriptor not found');
                    }
                } else {
                    this.onerror('Characteristic not found');
                }
            } else {
                this.onerror('Service not found');
            }
        } else {
            this.onerror('Peripheral not found');
        }
        return resultObj;
    };

    this.oninit = function (params) {
    };

    this.configure = function (pwrAlert, centralID, callback) {
        if (callback) this.onconfigure = callback;

        var params = {};
        params[C.kShowPowerAlert] = pwrAlert;
        params[C.kIdentifierKey] = centralID;
        this.write(C.kConfigure, params);
    };

    this.onconfigure = function (params) {
    };

    this.scan = function (scanDuplicates, services, callback) {
        if (callback) this.onscan = callback;
        this.peripherals = {};
        var params = {};
        params[C.kScanOptionAllowDuplicatesKey] = scanDuplicates;
        params[C.kServiceUUIDs] = services;
        this.write(C.kScanForPeripherals, params);
    };

    this.onscan = function (params) {
    };

    this.stopScan = function (callback) {
        if (callback) this.onscan = callback;

        var params = {};
        this.write(C.kStopScanning, params);
    };

    this.onstopScan = function (params) {
    };

    this.centralState = function () {
        var params = {};
        this.write(C.kCentralState, params);
    };

    this.onstate = function (state) {
    };

    this.onupdateRSSI = function (peripheral) {
    };

    this.onerror = function (err_msg) {
        console.log(err_msg);
    };

    this.close = function (callback) {
        if (client) {
            client.close();
        }
    };

    this.onclose = function (params, error) {};

    this.ondescriptorRead = function (peripheral, service, characteristic, descriptor, error) {};

    this.ondescriptorWrite = function (peripheral, service, characteristic, descriptor, error) {};

    this.write = function (method, params, id) {
        var mesg = {};
        mesg.jsonrpc = "2.0";
        mesg.method = method;
        mesg.params = params;
        mesg.id = C.id.toString();
        C.id += 1;
        this.send(JSON.stringify(mesg));
    };

    this.send = function (mesg) {
        if (!client) {
            this.onerror("not connected");
            return;
        }
        if (client.readyState !== 1) {
            console.log('Socket is CLOSED');
            return;
        }
        client.send(mesg);
    };
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.GATTIP = GATTIP;
}if(typeof process === 'object' && process + '' === '[object process]') {
	module.exports.GATTIP = require('./gattip').GATTIP;
	module.exports.GattIpServer = require('./gattip-server').GattIpServer;
}function Peripheral(gattip, name, uuid, addr, rssi, addata, scanData) {
    var path = "lib/gatt-ip-js/browser/"; // Replace the path to json configuration file.

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Service = require("./service.js").Service;
    }

    var _gattip = gattip;
    this.name = name;
    this.uuid = uuid;
    this.advertisementData = addata;
    this.scanData = scanData;
    this.serviceUUIDs = {};
    if (addata)this.rawAdvertisingData = addata[C.kRawAdvertisementData];
    this.manufacturerData = '';
    this.rssi = rssi;
    this.addr = addr;
    this.isConnected = false;
    this.services = {};

    this.serviceNames;
    this.characteristicNames;
    this.descriptorNames;

    var self = this;

    var flag = true;

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    //parse advertising data
    this.advdata = new Array();
    if (this.rawAdvertisingData) {
        if (this.rawAdvertisingData.length % 2 === 0) {
            for (var i = 0; i < this.rawAdvertisingData.length; i = i + 2) {
                this.advdata[i / 2] = this.rawAdvertisingData.charAt(i) + this.rawAdvertisingData.charAt(i + 1);
            }
        } else {
            for (var j = 0; j < this.rawAdvertisingData.length; j++) {
                this.advdata[j] = this.rawAdvertisingData.charAt(2 * j) + this.rawAdvertisingData.charAt(2 * j + 1);
            }
        }
    }

    do {
        if (this.advdata[1] == C.kGAP_ADTYPE_FLAGS) {
            getDiscoverable(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_POWER_LEVEL) {
            getTXLevel(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID) {
            getServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID) {
            getServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID) {
            get128bitServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_MANUFACTURER_SPECIFIC) {
            getManufacturerData(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_16BIT_SERVICE_DATA) {
            getServiceData(this);
        } else if (this.advdata[1] == "00") {
            this.advdata.splice(0, 1);
        } else {
            var advdataLength = parseInt(this.advdata[0], 16);
            this.advdata.splice(0, advdataLength + 1);
        }
        if (this.advdata.length === 0)
            flag = false;
    } while (flag);

    this.connect = function (callback) {
        if (callback) this.onconnect = callback;

        // TODO: Loading the JSON's for UUID names
        /* if (typeof $ === 'undefined') {
            $ = {
                getJSON : function (path, callback) {
                    var f = module.filename;
                    var load = f.substring(0, f.lastIndexOf('/')) + '/../../' + path;
                    var json = require(load);
                    callback(json);
                }
            }
        } */

        /* $.getJSON(path + "bleServices.json", function(res) {
            self.serviceNames = res;
            $.getJSON(path + "bleCharacteristics.json", function (res) {
                self.characteristicNames = res;
                $.getJSON(path + "bleDescriptors.json", function (res) {
                    self.descriptorNames = res;
                    
                });
            });
        }); */

        var params = {};
        params[C.kPeripheralUUID] = self.uuid;
        _gattip.write(C.kConnect, params);
    };

    this.onconnect = function (error) {
        if (!error) {
            this.isConnected = true;
        }
    };

    this.disconnect = function (callback) {
        if (callback) this.onconnect = callback;

        var params = {};
        params[C.kPeripheralUUID] = this.uuid;
        _gattip.write(C.kDisconnect, params);
    };

    this.ondisconnect = function (error) {
        if (!error) {
            console.log(this.name + ' disconnected');
            this.isConnected = false;
        }
    };

    this.discoverServices = function (callback) {
        if (callback) this.ondiscoverServices = callback;

        if (this.services && Object.size(this.services) > 0) {
            _gattip.ondiscoverServices(this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = this.uuid;
            _gattip.write(C.kGetServices, params);
        }
    };

    this.ondiscoverServices = function (params) {
        for (var index in params[C.kServices]) {
            var serviceUUID = params[C.kServices][index][C.kServiceUUID];
            var service = this.services[serviceUUID];
            if (!service) {
                service = new Service(_gattip, this, serviceUUID);
            }
            this.services[serviceUUID] = service;
        }
    };

    this.updateRSSI = function (callback) {
        if (callback) this.onupdateRSSI = callback;

        var params = {};
        params[C.kPeripheralUUID] = this.uuid;

        _gattip.write(C.kGetRSSI, params);
    };

    this.onupdateRSSI = function (params) {
        console.log("kGetRSSI event"); //TODO
    };

    this.discoverServicesRequest = function () {
        if(_gattip.discoverServicesRequest){
            _gattip.discoverServicesRequest(this);
        }else{
            throw Error('discoverServicesRequest method not implemented by server');
        }
    };

    this.discoverServicesResponse = function (error) {
        if(!error){
            params = {};
            var servicesArray = [];

            for (var uuid in this.services) {
                var obj = {};
                obj[C.kServiceUUID] = this.services[uuid].uuid;
                obj[C.kIsPrimaryKey] = this.services[uuid].isPrimary;
                servicesArray.push(obj);
            }
            params[C.kServices] = servicesArray;
            params[C.kPeripheralUUID] = this.uuid;
            _gattip.write(C.kGetServices, params);
        }else{
            _gattip.write(C.kGetServices, kError32603, error);
        }
    };

    this.addService = function (serviceUUID) {
        var service = new Service(_gattip, this, serviceUUID);
        this.services[service.uuid] = service;

        return service;
    };


    function getDiscoverable(peripheral) {
        var discoverableDataLength = parseInt(peripheral.advdata[0], 16);
        if (parseInt(peripheral.advdata[2], 16) >= 1) {
            peripheral.discoverable = "true";
        } else
            peripheral.discoverable = "false";
        peripheral.advdata.splice(0, discoverableDataLength + 1);
    }

    function getTXLevel(peripheral) {
        var txlevelDataLength = parseInt(peripheral.advdata[0], 16);
        peripheral.txpowerLevel = parseInt(peripheral.advdata[2]);
        peripheral.advdata.splice(0, txlevelDataLength + 1);
    }

    function getManufacturerData(peripheral) {
        var manufacturerDataLength = parseInt(peripheral.advdata[0], 16);
        for (var k = 2; k <= manufacturerDataLength; k++) {
            peripheral.manufacturerData += peripheral.advdata[k];
        }
        peripheral.advdata.splice(0, manufacturerDataLength + 1);
    }

    function getServiceUUIDs(peripheral) {
        var service16bitDataLength = parseInt(peripheral.advdata[0], 16);
        var reverse16bitUUID = '';
        for (var i = service16bitDataLength; i >= 2; i--) {
            reverse16bitUUID += peripheral.advdata[i];
        }
        peripheral.serviceUUIDs[0] = reverse16bitUUID;
        peripheral.advdata.splice(0, service16bitDataLength + 1);
    }

    function get128bitServiceUUIDs(peripheral) {
        var service128bitDataLength = parseInt(peripheral.advdata[0], 16);
        var reverse128bitUUID = '';
        for (var i = service128bitDataLength; i >= 2; i--) {
            reverse128bitUUID += peripheral.advdata[i];
            if (i == 14 || i == 12 || i == 10 || i == 8) {
                reverse128bitUUID += "-";
            }
        }
        peripheral.serviceUUIDs[0] = reverse128bitUUID;
        peripheral.advdata.splice(0, service128bitDataLength + 1);
    }

    function getServiceData(peripheral) {
        var serviceDataLength = parseInt(peripheral.advdata[0], 16);
        var eddystoneServiceUUID = '';
        for (var i = 3; i >= 2; i--) {
            eddystoneServiceUUID += peripheral.advdata[i];
        }
        if (eddystoneServiceUUID == 'FEAA') {
            if (parseInt(peripheral.advdata[4], 16) === 0) {
                getUID(peripheral);
            } else if (parseInt(peripheral.advdata[4], 16) == 16) {
                getURL(peripheral);
            } else if (parseInt(peripheral.advdata[4], 16) == 32) {
                getTLM(peripheral);
            }
        }
        peripheral.advdata.splice(0, serviceDataLength + 1);
    }

    function getUID(peripheral) {
        peripheral.frameType = 'UID';
        peripheral.nameSpace = '';
        peripheral.instanceID = '';
        peripheral.txpowerLevel = parseInt(peripheral.advdata[5], 16);
        for (var i = 6; i < 16; i++) {
            peripheral.nameSpace += peripheral.advdata[i];
        }
        for (var j = 16; j < 22; j++) {
            peripheral.instanceID += peripheral.advdata[j];
        }
        peripheral.reserved = peripheral.advdata[22];
        peripheral.reserved += peripheral.advdata[23];
    }

    function getURL(peripheral) {
        peripheral.frameType = 'URL';
        peripheral.txpowerLevel = parseInt(peripheral.advdata[5]);
        for (var protocol in C.AllProtocols) {
            if (advdata[6] == protocol)
                peripheral.url = C.AllProtocols[protocol];
        }
        for (var i = 7; i < advdataLength; i++) {
            peripheral.url += String.fromCharCode(parseInt(peripheral.advdata[i], 16));
        }
        for (var domain in C.AllDomains) {
            if (peripheral.advdata[advdataLength] == domain)
                peripheral.url += C.AllDomains[domain];
        }
    }

    function getTLM(peripheral) {
        peripheral.frameType = 'TLM';
        peripheral.advPacketCount = '';
        peripheral.timeInterval = '';
        peripheral.batteryVoltage = '';
        peripheral.eddyVersion = parseInt(peripheral.advdata[5], 16);
        for (var i = 6; i < 8; i++) {
            peripheral.batteryVoltage += peripheral.advdata[i];
        }
        peripheral.batteryVoltage = parseInt(peripheral.batteryVoltage, 16);
        peripheral.temperature = Math.ceil(parseInt(peripheral.advdata[8], 16));
        peripheral.temperature += '.';
        var temp = Math.ceil(((1 / 256) * parseInt(peripheral.advdata[9], 16)));
        if (temp.length > 2)
            peripheral.temperature += temp.toString().substring(0, 2);
        else
            peripheral.temperature += temp;
        for (var j = 10; j < 14; j++) {
            peripheral.advPacketCount += peripheral.advdata[j];
        }
        peripheral.advPacketCount = parseInt(peripheral.advPacketCount, 16);
        for (var k = 14; k < 18; k++) {
            peripheral.timeInterval += peripheral.advdata[k];
        }
        peripheral.timeInterval = Math.ceil(parseInt(peripheral.timeInterval, 16) * 0.1);
        peripheral.timePeriod = '';
        if (peripheral.timeInterval >= 60) {
            var days = Math.floor(peripheral.timeInterval / 86400);
            if (days > 0) {
                peripheral.timePeriod += days < 10 ? days + 'day ' : days + 'days ';
                peripheral.timeInterval -= days * 24 * 60 * 60;
            }
            var hours = Math.floor(peripheral.timeInterval / 3600);
            if (hours > 0) {
                peripheral.timePeriod += hours < 10 ? '0' + hours + ':' : hours + ':';
                peripheral.timeInterval -= hours * 60 * 60;
            } else
                peripheral.timePeriod += '00:';
            var min = Math.floor(peripheral.timeInterval / 60);
            if (min > 0) {
                peripheral.timePeriod += min < 10 ? '0' + min + ':' : min + ':';
                peripheral.timeInterval -= min * 60;
                peripheral.timePeriod += peripheral.timeInterval < 10 ? '0' + peripheral.timeInterval : peripheral.timeInterval;
                peripheral.timePeriod += ' secs';
                peripheral.timeInterval = 0;
            } else {
                peripheral.timePeriod += '00:' + peripheral.timeInterval;
                peripheral.timeInterval = 0;
            }
        } else if (peripheral.timeInterval > 0 && peripheral.timeInterval < 60) {
            peripheral.timePeriod += peripheral.timeInterval < 10 ? '00:00:0' + peripheral.timeInterval : '00:00:' + peripheral.timeInterval;
            peripheral.timePeriod += ' secs';
        }
    }

}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Peripheral = Peripheral;
}
function Service(gattip, peripheral, uuid) {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Characteristic = require("./characteristic.js").Characteristic;
    }

    var _gattip = gattip;
    var _peripheral = peripheral;

    this.uuid = uuid;
    this.isPrimary = true; //TODO: read from remote
    this.characteristics = {};
    this.includedServices = {};
    this.serviceName = '';

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    if (peripheral.serviceNames && peripheral.serviceNames[uuid]) {
        var uuidObj = peripheral.serviceNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.serviceName = uuidObj.name;
        }
    }

    this.discoverIncludedServices = function (callback) {
    };

    this.ondiscoverIncludedServices = function (error) {
    };

    this.discoverCharacteristics = function (callback) {
        if (callback) this.ondiscoverCharacteristics = callback;

        if (this.characteristics && Object.size(this.characteristics) > 0) {
            _gattip.ondiscoverCharacteristics(_peripheral, this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = this.uuid;

            _gattip.write(C.kGetCharacteristics, params);
        }
    };

    this.ondiscoverCharacteristics = function (params) {
        for (var index in params[C.kCharacteristics]) {
            var characteristicUUID = params[C.kCharacteristics][index][C.kCharacteristicUUID];
            var characteristic = this.characteristics[characteristicUUID];
            if (!characteristic) {
                characteristic = new Characteristic(_gattip, _peripheral, this, characteristicUUID);
            }
            this.characteristics[characteristicUUID] = characteristic;

            characteristic.value = params[C.kCharacteristics][index][C.kValue];

            var props = params[C.kCharacteristics][index][C.kProperties];
            for (var apindex in C.AllProperties) {
                characteristic.properties[C.AllProperties[apindex]] = {
                    enabled: (props >> apindex) & 1,
                    name: C.AllProperties[apindex]
                };
            }

            characteristic.isNotifying = params[C.kCharacteristics][index][C.kIsNotifying];
        }
    };

    this.discoverCharacteristicsRequest = function () {
        if(_gattip.discoverCharacteristicsRequest){
            _gattip.discoverCharacteristicsRequest(_peripheral, this);
        }else{
            throw Error('discoverCharacteristicsRequest method not implemented by server');
        }
    };

    this.discoverCharacteristicsResponse = function (error) {
        if(!error){
            params = {};
            var charsArray = [];

            for (var uuid in this.characteristics) {
                var obj = {};
                obj[C.kCharacteristicUUID] = this.characteristics[uuid].uuid;
                obj[C.kProperties] = (this.characteristics[uuid].properties) ? this.characteristics[uuid].properties : '';
                obj[C.kValue] = this.characteristics[uuid].value;
                obj[C.kIsNotifying] = this.characteristics[uuid].isNotifying;
                charsArray.push(obj);
            }
            params[C.kCharacteristics] = charsArray;
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = this.uuid;

            _gattip.write(C.kGetCharacteristics, params);
        }else{
            _gattip.write(C.kGetCharacteristics, kError32603, error);
        }        
    };

    this.addCharacteristic = function (characteristicUUID) {
        var characteristic = new Characteristic(_gattip, _peripheral, this, characteristicUUID);
        this.characteristics[characteristic.uuid] = characteristic;

        return characteristic;
    };
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Service = Service;
}

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
function Characteristic(gattip, peripheral, service, uuid) {
    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Descriptor = require("./descriptor.js").Descriptor;
    }

    var _gattip = gattip;
    var _peripheral = peripheral;
    var _service = service;

    this.uuid = uuid;
    this.descriptors = {};
    this.properties = {};
    this.value = '';
    this.characteristicName = '';
    this.isNotifying = false;

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    if (peripheral.characteristicNames && peripheral.characteristicNames[uuid]) {
        var uuidObj = peripheral.characteristicNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.characteristicName = uuidObj.name;
        }
    }


    this.discoverDescriptors = function (callback) {
        if (callback) this.ondiscoverDescriptors = callback;

        if (this.descriptors && Object.size(this.descriptors) > 0) {
            _gattip.ondiscoverDescriptors(_peripheral, _service, this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            _gattip.write(C.kGetDescriptors, params);
        }
    };

    this.ondiscoverDescriptors = function (params) {
        for (var index in params[C.kDescriptors]) {
            var descriptorUUID = params[C.kDescriptors][index][C.kDescriptorUUID];
            var descriptor = this.descriptors[descriptorUUID];
            if (!descriptor) {
                descriptor = new Descriptor(_gattip, _peripheral, _service, this, descriptorUUID);
            }
            
            var props = params[C.kDescriptors][index][C.kProperties];
            for (var apindex in C.AllProperties) {
                descriptor.properties[C.AllProperties[apindex]] = {
                    enabled: (props >> apindex) & 1,
                    name: C.AllProperties[apindex]
                };
            }

            this.descriptors[descriptorUUID] = descriptor;
        }
    };

    this.read = function (callback) {
        if (callback) this.onread = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.onread = function (params) {
        this.isNotifying = params[C.kIsNotifying];
        this.value = params[C.kValue];
    };

    this.write = function (data, callback) {
        var restype;
        if (this.properties["WriteWithoutResponse"].enabled == 1 || this.properties["Indicate"].enabled == 1) {
            restype = C.kWriteWithoutResponse;
        } else {
            restype = C.kWriteResponse;
        }
        this.writeWithResType(data, restype, callback);
    };

    this.writeWithResType = function (data, restype, callback) {
        if (callback) this.onwrite = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        params[C.kValue] = data;
        params[C.kWriteType] = restype;
        _gattip.write(C.kWriteCharacteristicValue, params);
    };

    this.onwrite = function (params, error) {
    };

    this.notify = function (value, callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;
        params[C.kValue] = value;
        this.isNotifying = value;

        _gattip.write(C.kSetValueNotification, params);
    };

    this.indicate = function (callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;

        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.broadcast = function (callback) {
        if (callback) this.onread = callback;

        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = this.uuid;

        _gattip.write(C.kGetCharacteristicValue, params);
    };

    this.discoverDescriptorsRequest = function () {
        if (_gattip.discoverDescriptorsRequest) {
            _gattip.discoverDescriptorsRequest(_peripheral, _service, this);
        } else {
            throw Error('discoverDescriptorsRequest method not implemented by server');
        }
    };

    this.discoverDescriptorsResponse = function (error) {
        if (!error) {
            params = {};
            var discArray = [];

            for (var uuid in this.descriptors) {
                var obj = {};
                obj[C.kDescriptorUUID] = this.descriptors[uuid].uuid;
                obj[C.kProperties] = this.descriptors[uuid].properties;
                obj[C.kValue] = this.descriptors[uuid].value;
                obj[C.kIsNotifying] = this.descriptors[uuid].isNotifying;
                discArray.push(obj);
            }
            params[C.kDescriptors] = discArray;
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;

            _gattip.write(C.kGetDescriptors, params);
        } else {
            _gattip.write(C.kGetCharacteristics, kError32603, error);
        }
    };

    this.readCharacteristicValueRequest = function (params) {
        if (_gattip.readCharacteristicValueRequest) {
            _gattip.readCharacteristicValueRequest(_peripheral, _service, this);
        } else {
            throw Error('readCharacteristicValueRequest method not implemented by server');
        }
    };

    this.writeCharacteristicValueRequest = function (params) {
        if (_gattip.writeCharacteristicValueRequest) {
            _gattip.writeCharacteristicValueRequest(_peripheral, _service, this, params[C.kValue]);
        } else {
            throw Error('writeCharacteristicValueRequest method not implemented by server');
        }
    };

    this.enableNotificationsRequest = function (params) {
        if (_gattip.enableNotificationsRequest) {
            _gattip.enableNotificationsRequest(_peripheral, _service, this, params[C.kValue]);
        } else {
            throw Error('enableNotificationsRequest method not implemented by server');
        }
    };

    this.respondToReadRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kGetCharacteristicValue, C.kError32603, 'Failed to read the Characteristic value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            params[C.kValue] = this.value;
            params[C.kIsNotifying] = this.isNotifying;

            _gattip.write(C.kGetCharacteristicValue, params);
        }
    };

    this.respondToWriteRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kWriteCharacteristicValue, C.kError32603, 'Failed to write the Characteristic value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = this.uuid;
            params[C.kValue] = this.value;

            _gattip.write(C.kWriteCharacteristicValue, params);
        }
    };

    function respondNotify(self) {

        params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = self.uuid;
        params[C.kIsNotifying] = self.isNotifying;
        params[C.kValue] = self.value;

        _gattip.write(C.kSetValueNotification, params);
    }

    this.respondWithNotification = function (value) {
        this.value = value;
        respondNotify(this);
    };

    this.respondToChangeNotification = function (isNotifying) {
        this.isNotifying = isNotifying;
        respondNotify(this);
    };

    this.addDescriptor = function (descriptorUUID) {
        var descriptor = new Descriptor(_gattip, _peripheral, _service, this, descriptorUUID);
        this.descriptors[descriptor.uuid] = descriptor;

        return descriptor;
    };

    this.updateValue = function (value) {
        this.value = value;
        return this;
    };

    this.updateProperties = function (properties) {
        this.properties = properties;
        return this;
    };

}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Characteristic = Characteristic;
}

}).call(this,require('_process'))
},{"./constants.js":2,"./descriptor.js":3,"_process":20}],2:[function(require,module,exports){
(function (process){
var C = {
    kError: "error",
    kCode: "code",
    kMessageField: "message",
    kResult: "result",
    kIdField: "id",
    kConfigure: "aa",
    kScanForPeripherals: "ab",
    kStopScanning: "ac",
    kConnect: "ad",
    kDisconnect: "ae",
    kCentralState: "af",
    kGetConnectedPeripherals: "ag",
    kGetPerhipheralsWithServices: "ah",
    kGetPerhipheralsWithIdentifiers: "ai",
    kGetServices: "ak",
    kGetIncludedServices: "al",
    kGetCharacteristics: "am",
    kGetDescriptors: "an",
    kGetCharacteristicValue: "ao",
    kGetDescriptorValue: "ap",
    kWriteCharacteristicValue: "aq",
    kWriteDescriptorValue: "ar",
    kSetValueNotification: "as",
    kGetPeripheralState: "at",
    kGetRSSI: "au",
    kInvalidatedServices: "av",
    kPeripheralNameUpdate: "aw",
    kMessage: "zz",
    kCentralUUID: "ba",
    kPeripheralUUID: "bb",
    kPeripheralName: "bc",
    kPeripheralUUIDs: "bd",
    kServiceUUID: "be",
    kServiceUUIDs: "bf",
    kPeripherals: "bg",
    kIncludedServiceUUIDs: "bh",
    kCharacteristicUUID: "bi",
    kCharacteristicUUIDs: "bj",
    kDescriptorUUID: "bk",
    kServices: "bl",
    kCharacteristics: "bm",
    kDescriptors: "bn",
    kProperties: "bo",
    kValue: "bp",
    kState: "bq",
    kStateInfo: "br",
    kStateField: "bs",
    kWriteType: "bt",
    kRSSIkey: "bu",
    kIsPrimaryKey: "bv",
    kIsBroadcasted: "bw",
    kIsNotifying: "bx",
    kShowPowerAlert: "by",
    kIdentifierKey: "bz",
    kScanOptionAllowDuplicatesKey: "b0",
    kScanOptionSolicitedServiceUUIDs: "b1",
    kAdvertisementDataKey: "b2",
    kCBAdvertisementDataManufacturerDataKey: "b3",
    kCBAdvertisementDataServiceUUIDsKey: "b4",
    kCBAdvertisementDataServiceDataKey: "b5",
    kCBAdvertisementDataOverflowServiceUUIDsKey: "b6",
    kCBAdvertisementDataSolicitedServiceUUIDsKey: "b7",
    kCBAdvertisementDataIsConnectable: "b8",
    kCBAdvertisementDataTxPowerLevel: "b9",
    kPeripheralBtAddress: "c1",
    kRawAdvertisementData: "c2",
    kScanRecord: "c3",
    kCBCentralManagerRestoredStatePeripheralsKey: "da",
    kCBCentralManagerRestoredStateScanServicesKey: "db",
    kWriteWithResponse: "cc",
    kWriteWithoutResponse: "cd",
    kNotifyOnConnection: "ce",
    kNotifyOnDisconnection: "cf",
    kNotifyOnNotification: "cg",
    kDisconnected: "ch",
    kConnecting: "ci",
    kConnected: "cj",
    kUnknown: "ck",
    kResetting: "cl",
    kUnsupported: "cm",
    kUnauthorized: "cn",
    kPoweredOff: "co",
    kPoweredOn: "cp",
    kErrorPeripheralNotFound: "-32001",
    kErrorServiceNotFound: "-32002",
    kErrorCharacteristicNotFound: "-32003",
    kErrorDescriptorNotFound: "-32004",
    kErrorPeripheralStateIsNotValid: "-32005",
    kErrorNoServiceSpecified: "-32006",
    kErrorNoPeripheralIdentiferSpecified: "-32007",
    kErrorStateRestorationNotValid: "-32008",
    kInvalidRequest: "-32600",
    kMethodNotFound: "-32601",
    kInvalidParams: "-32602",
    kError32603: "-32603",
    kParseError: "-32700",
    kGAP_ADTYPE_FLAGS: "01",
    kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID: "02",
    kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID: "03",
    kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID: "04",
    kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID: "05",
    kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID: "06",
    kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID: "07",
    kGAP_ADTYPE_POWER_LEVEL: "0A",
    kGAP_ADTYPE_MANUFACTURER_SPECIFIC: "FF",
    kGAP_ADTYPE_16BIT_SERVICE_DATA: "16",
    id: 1,
    authenticate: 'authenticate',
    AllProperties: ["Broadcast", "Read", "WriteWithoutResponse", "Write", "Notify", "Indicate", "AuthenticatedSignedWrites", "ExtendedProperties", "NotifyEncryptionRequired", "IndicateEncryptionRequired"]
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.C = C;
}
}).call(this,require('_process'))
},{"_process":20}],3:[function(require,module,exports){
(function (process){
function Descriptor(gattip, peripheral, service, characteristic, uuid) {
    var _gattip = gattip;
    var _peripheral = peripheral;
    var _service = service;
    var _characteristic = characteristic;
    this.uuid = uuid;
    this.value = "";
    this.descriptorName = '';
    this.properties = {};
    this.isNotifying = false;

    if (peripheral.descriptorNames && peripheral.descriptorNames[uuid]) {
        var uuidObj = peripheral.descriptorNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.descriptorName = uuidObj.name;
        }
    }

    this.updateValue = function (value) {
        this.value = value;
        return this;
    };

    this.updateProperties = function (properties) {
        this.properties = properties;
        return this;
    };

    this.read = function (callback) {
        if (callback) this.onread = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = _characteristic.uuid;
        params[C.kDescriptorUUID] = this.uuid;
        _gattip.write(C.kGetDescriptorValue, params);
    };

    this.onread = function (params) {
        this.isNotifying = params[C.kIsNotifying];
        this.value = params[C.kValue];
    };

    this.write = function (data, callback) {
        if (callback) this.onwrite = callback;
        var params = {};
        params[C.kPeripheralUUID] = _peripheral.uuid;
        params[C.kServiceUUID] = _service.uuid;
        params[C.kCharacteristicUUID] = _characteristic.uuid;
        params[C.kDescriptorUUID] = this.uuid;
        params[C.kValue] = data;
        _gattip.write(C.kWriteDescriptorValue, params);
    };

    this.onwrite = function (params) {
    };

    this.readDescriptorValueRequest = function (params) {
        if (_gattip.readDescriptorValueRequest) {
            _gattip.readDescriptorValueRequest(_peripheral, _service, _characteristic, this);
        } else {
            throw Error('readDescriptorValueRequest method not implemented by server');
        }
    };

    this.writeDescriptorValueRequest = function (params) {
        if (_gattip.writeDescriptorValueRequest) {
            _gattip.writeDescriptorValueRequest(_peripheral, _service, _characteristic, this, params[C.kValue]);
        } else {
            throw Error('writeDescriptorValueRequest method not implemented by server');
        }
    };

    this.respondToReadDescriptorValueRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kGetDescriptorValue, C.kError32603, 'Failed to read the descriptor value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = _characteristic.uuid;
            params[C.kDescriptorUUID] = this.uuid;
            params[C.kValue] = this.value;
            params[C.kIsNotifying] = this.isNotifying;

            _gattip.write(C.kGetDescriptorValue, params);
        }
    };

    this.respondToWriteDescriptorValueRequest = function (error) {

        if (error) {
            this.sendErrorResponse(C.kWriteDescriptorValue, C.kError32603, 'Failed to write the descriptor value');
        } else {
            params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = _service.uuid;
            params[C.kCharacteristicUUID] = _characteristic.uuid;
            params[C.kDescriptorUUID] = this.uuid;
            params[C.kValue] = this.value;

            _gattip.write(C.kWriteDescriptorValue, params);
        }
    };


}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Descriptor = Descriptor;
}


}).call(this,require('_process'))
},{"_process":20}],4:[function(require,module,exports){
(function (process){
function GattIpServer() {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Peripheral = require("./peripheral.js").Peripheral;
        WebSocket = require('websocket').w3cwebsocket;
    }

    var server;
    this.state = C.kUnknown;
    this.peripherals = {};

    this.init = function (url, callback) {
        if (callback) this.oninit = callback;

        this.socket = new WebSocket(url);

        this.socket.onopen = function () {
            this.initWithServer(this.socket);
            if (this.oninit) {
                this.oninit();
            }
        }.bind(this);
    };

    this.initWithServer = function (_server) {
        server = _server;

        if (!server.send) {
            throw Error('server must implement the send method');
        }
        server.onmessage = this.processMessage.bind(this);

        if (!server.onclose) {
            server.onclose = function () {
                console.log('socket is closed')
            };
        }
        if (!server.onerror) {
            server.onerror = function (error) {
                console.log('socket is onerror, onerror' + error);
            };
        }
        if (!server.error) {
            server.onerror = function (error) {
                console.log('socket is error, error' + error);
            };
        }
    };

    this.processMessage = function (mesg) {
        var message = JSON.parse(mesg.data);
        var params, peripheral, service, characteristic, descriptor, gObject;

        if ((typeof message === 'undefined') || (!message)) {
            params = {};
            params[C.kCode] = C.kInvalidRequest;
            this.write(C.kError, params);
            return;
        }

        if (message.result && message.result == C.kMessage) {
            this.onauthenticate(message.params, message.error);
            return;
        }

        if (message.error) {
            this.sendErrorResponse(message.method, C.kInvalidRequest, 'Error in the Request');
            return;
        }

        //TODO: It is better to remove the devices, if length is going to infinite, based on like recently used..
        //TODO: General comment - you should not be tracking peripherals/services/etc.
        //  Burden the gateway to do this and respond accordingly TO YOU with appropriate error
        //  Each gateway/stack tracks peripherals/services/etc. so you don't have to
        //TODO: General comment - ensure that the library can deal with blank strings and arrays that are nulls or undefined.
        // Address/convert missing values accordingly
        //TODO: General comment - The purpose of this module is to parse AND VERIFY each argument passed to it in order to protect
        // both sides -- the client and the server -- from the other misbehaving, but not going too far to ensure
        // that correct messages are sent in correct sequence. You are stateless, and you don't care if a client wants to connect to an undiscovered
        // service
        // You should do minimal message integrity checks. Examples that this code fails at:
        //      - Address in connect request is blank - server crashes
        //      - Scan response data is sent as an array from the server - client crashes because it expects a hex string
        //TODO: Ensure that no message sent by the client can crash you. This is also a hack attack vector, so you ought to not crash on bad messages

        //TODO: Consider putting this in an associative array, rather than a switch
        switch (message.method) {
            case C.kConfigure:
                this.configureRequest(message.params);
                break;
            case C.kScanForPeripherals:
                this.scanRequest(message.params);
                break;
            case C.kStopScanning:
                this.stopScanRequest(message.params);
                break;
            case C.kConnect:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    this.connectRequest(gObject.peripheral);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kDisconnect:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    this.disconnectRequest(gObject.peripheral);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kCentralState:
                this.centralStateRequest(message.params);
                break;
            case C.kGetServices:
                try {
                    gObject = this.getObjects('P', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.peripheral.discoverServicesRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetIncludedServices:
                console.log("kGetIncludedServices event"); //TODO
                break;
            case C.kInvalidatedServices:
                console.log("kInvalidatedServices event"); //TODO
                break;
            case C.kGetCharacteristics:
                try {
                    gObject = this.getObjects('S', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.service.discoverCharacteristicsRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptors:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.discoverDescriptorsRequest();
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetCharacteristicValue:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.readCharacteristicValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteCharacteristicValue:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.writeCharacteristicValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kSetValueNotification:
                try {
                    gObject = this.getObjects('C', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.characteristic.isNotifying = message.params[C.kValue];
                    gObject.characteristic.enableNotificationsRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptorValue:
                try {
                    gObject = this.getObjects('D', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.descriptor.readDescriptorValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteDescriptorValue:
                try {
                    gObject = this.getObjects('D', message.params[C.kPeripheralUUID], message.params[C.kServiceUUID], message.params[C.kCharacteristicUUID], message.params[C.kDescriptorUUID]);
                    gObject.descriptor.writeDescriptorValueRequest(message.params);
                } catch (ex) {
                    console.error(ex);
                }
                break;

            default:
                console.log('invalid request' + message.method);
                this.sendErrorResponse(message.method, C.kInvalidRequest, 'Request not handled by server');
                return;
        }
        this.message = message;
    };


    this.getObjects = function (type, peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID) {

        var resultObj = {};

        resultObj.peripheral = this.peripherals[peripheralUUID];
        if (resultObj.peripheral) {
            if (type === 'P') {
                return resultObj;
            }
            resultObj.service = resultObj.peripheral.services[serviceUUID];
            if (resultObj.service) {
                if (type === 'S') {
                    return resultObj;
                }
                resultObj.characteristic = resultObj.service.characteristics[characteristicUUID];
                if (resultObj.characteristic) {
                    if (type === 'C') {
                        return resultObj;
                    }
                    resultObj.descriptor = resultObj.characteristic.descriptors[descriptorUUID];
                    if (resultObj.descriptor) {
                        return resultObj;
                    } else {
                        this.sendErrorResponse(message.method, C.kErrorDescriptorNotFound, 'Descriptor not found');
                        throw Error('Descriptor not found');
                    }
                } else {
                    this.sendErrorResponse(message.method, C.kErrorCharacteristicNotFound, 'Characteristic not found');
                    throw Error('Characteristic not found');
                }
            } else {
                this.sendErrorResponse(message.method, C.kErrorServiceNotFound, 'Service not found');
                throw Error('Service not found');
            }
        } else {
            this.sendErrorResponse(message.method, C.kErrorPeripheralNotFound, 'Peripheral not found');
            throw Error('Peripheral not found');
        }

    };

    this.sendErrorResponse = function (method, errorId, errMessage) {
        var error = {};
        params = {};
        error[C.kCode] = errorId;
        error[C.kMessageField] = errMessage;
        params[C.kError] = error;
        this.write(method, undefined, undefined, error);
    };

    this.authenticate = function (token) {
        this.send(JSON.stringify({
            type: C.authenticate,
            access_token: token
        }));
    };

    this.configureRequest = function () {
        console.error('configureRequest method not implemented by server');
    };

    this.configureResponse = function (error) {
        if (!error) {
            this.write(C.kConfigure);
        } else {
            this.write(C.kConfigure, error);
        }
    };

    this.centralStateRequest = function () {
        console.error('centralStateRequest method not implemented by server');
    };

    this.centralStateResponse = function (state, error) {
        if (!error) {
            params = {};
            params[C.kState] = state;
            this.write(C.kCentralState, params);
        } else {
            this.write(C.kCentralState, error);
        }
    };

    this.scanRequest = function () {
        console.error('scanRequest method not implemented by server');
    };

    this.scanResponse = function (name, uuid, addr, rssi, advertisementData, manufacturerData) {
        params = {};
        var advData = {};

        advData[C.kRawAdvertisementData] = advertisementData;
        params[C.kPeripheralName] = name;
        params[C.kPeripheralUUID] = uuid;
        params[C.kPeripheralBtAddress] = addr;
        params[C.kRSSIkey] = rssi;
        params[C.kAdvertisementDataKey] = advData;
        params[C.kScanRecord] = manufacturerData;

        this.write(C.kScanForPeripherals, params);
    };

    this.stopScanRequest = function () {
        console.error('stopScanRequest method not implemented by server');
    };

    this.stopScanResponse = function (error) {
        if (!error) {
            this.write(C.kStopScanning);
        } else {
            this.write(C.kStopScanning, error);
        }

    };

    this.connectRequest = function () {
        console.error('connectRequest method not implemented by server');
    };

    this.connectResponse = function (peripheral, error) {
        var peripheral_db = {};
        peripheral_db[C.kPeripheralUUID] = peripheral.uuid;
        peripheral_db[C.kPeripheralName] = peripheral.name;

        var service_db = {};
        service_db = getServiceJsonFromPeripheralObject(peripheral);
        peripheral_db[C.kServices] = service_db;

        if (!error) {
            this.write(C.kConnect, peripheral_db);
        } else {
            this.write(C.kConnect, error);
        }
    };

    this.disconnectRequest = function () {
        console.error('disconnectRequest method not implemented by server');
    };

    this.disconnectResponse = function (peripheral, error) {
        if (!error) {
            params = {};
            params[C.kPeripheralUUID] = peripheral.uuid;
            params[C.kPeripheralName] = peripheral.name;

            this.write(C.kDisconnect, params);
        } else {
            this.write(C.kDisconnect, error);
        }
    };

    this.write = function (result, params, id, error) {
        var mesg = {};
        mesg.jsonrpc = "2.0";
        mesg.result = result;
        mesg.params = params;
        mesg.error = error;
        mesg.id = C.id.toString();
        C.id += 1;
        this.send(JSON.stringify(mesg));
    };

    this.send = function (mesg) {
        if (!server) {
            this.onerror("not connected");
            return;
        }
        if (server.readyState !== 1) {
            console.log('Socket is CLOSED');
            return;
        }
        server.send(mesg);
    };

    this.close = function (callback) {
        if (server) {
            server.close();
        }
    };

    function getServiceJsonFromPeripheralObject(myPeripheral) {
        var service_db = {};

        if (myPeripheral && myPeripheral.services) {
            for (var uuid in myPeripheral.services) {
                var temp_service = {};
                temp_service[C.kServiceUUID] = uuid;
                temp_service[C.kIsPrimaryKey] = myPeripheral.services[uuid].isPrimary;
                temp_service[C.kCharacteristics] = getCharacteristicJsonFromServiceObject(myPeripheral.services[uuid]);

                service_db[uuid] = temp_service;
            }
        }

        return service_db;
    }

    function getCharacteristicJsonFromServiceObject(myService) {
        var characteristic_db = {};

        if (myService && myService.characteristics) {
            for (var uuid in myService.characteristics) {
                var temp_characteristic = {};
                temp_characteristic[C.kCharacteristicUUID] = uuid;
                temp_characteristic[C.kValue] = myService.characteristics[uuid].value;
                temp_characteristic[C.kProperties] = myService.characteristics[uuid].properties;
                temp_characteristic[C.kIsNotifying] = myService.characteristics[uuid].isNotifying;
                temp_characteristic[C.kDescriptors] = getDescriptorJsonFromCharacteristicObject(myService.characteristics[uuid]);

                characteristic_db[uuid] = temp_characteristic;
            }
        }

        return characteristic_db;
    }

    function getDescriptorJsonFromCharacteristicObject(myCharacteristic) {
        var descriptor_db = {};

        if (myCharacteristic && myCharacteristic.descriptors) {
            for (var uuid in myCharacteristic.descriptors) {
                var temp_descriptor = {};
                temp_descriptor[C.kDescriptorUUID] = uuid;
                temp_descriptor[C.kValue] = myCharacteristic.descriptors[uuid].value;
                temp_descriptor[C.kProperties] = myCharacteristic.descriptors[uuid].properties;
                temp_descriptor[C.kIsNotifying] = myCharacteristic.descriptors[uuid].isNotifying;

                descriptor_db[uuid] = temp_descriptor;
            }
        }

        return descriptor_db;
    }

    this.addPeripheral = function (name, uuid, addr, rssi, addata, scanData) {
        var peripheral = new Peripheral(this, name, uuid, addr, rssi, addata, scanData);
        this.peripherals[peripheral.uuid] = peripheral;

        return peripheral;
    };

    /* The following define the flags that are valid with the SecurityProperties */
    this.GATM_SECURITY_PROPERTIES_NO_SECURITY = 0x00000000;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_WRITE = 0x00000001;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_WRITE = 0x00000002;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_READ = 0x00000004;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_READ = 0x00000008;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_SIGNED_WRITES = 0x00000010;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000020;

    /* The following define the flags that are valid with the CharacteristicProperties */
    this.GATM_CHARACTERISTIC_PROPERTIES_BROADCAST = 0x00000001;
    this.GATM_CHARACTERISTIC_PROPERTIES_READ = 0x00000002;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE_WO_RESP = 0x00000004;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE = 0x00000008;
    this.GATM_CHARACTERISTIC_PROPERTIES_NOTIFY = 0x00000010;
    this.GATM_CHARACTERISTIC_PROPERTIES_INDICATE = 0x00000020;
    this.GATM_CHARACTERISTIC_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000040;
    this.GATM_CHARACTERISTIC_PROPERTIES_EXT_PROPERTIES = 0x00000080;

    /* The following define the flags that are valid with the DescriptorProperties */
    this.GATM_DESCRIPTOR_PROPERTIES_READ = 0x00000001;
    this.GATM_DESCRIPTOR_PROPERTIES_WRITE = 0x00000002;

}


if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.GattIpServer = GattIpServer;
}
}).call(this,require('_process'))
},{"./constants.js":2,"./peripheral.js":7,"_process":20,"websocket":9}],5:[function(require,module,exports){
(function (process){
function GATTIP() {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Peripheral = require("./peripheral.js").Peripheral;
        WebSocket = require('websocket').w3cwebsocket;
    }

    var client;
    this.peripherals = {};

    this.init = function (url, callback) {

        if (callback) this.oninit = callback;

        this.socket = new WebSocket(url);

        this.socket.onopen = function () {
            this.initWithClient(this.socket);
            if (this.oninit) {
                this.oninit();
            }
        }.bind(this);
    };

    this.initWithClient = function (_client) {
        this.state = C.kUnknown;
        client = _client;
        client.onmessage = this.processMessage.bind(this);
    };

    this.processMessage = function (mesg) {
        var response = JSON.parse(mesg.data);
        var peripheral, service, characteristic, descriptor, gObject = {};

        switch (response.result) {
            case C.kConfigure:
                this.onconfigure(response.params, response.error);
                break;
            case C.kScanForPeripherals:
                if (response.params && response.params[C.kPeripheralUUID])
                    peripheral = this.peripherals[response.params[C.kPeripheralUUID]];
                if (!response.error) {
                    peripheral = new Peripheral(this,
                        response.params[C.kPeripheralName],
                        response.params[C.kPeripheralUUID],
                        response.params[C.kPeripheralBtAddress],
                        response.params[C.kRSSIkey],
                        response.params[C.kAdvertisementDataKey],
                        response.params[C.kScanRecord]);

                    this.peripherals[response.params[C.kPeripheralUUID]] = peripheral;
                }
                this.onscan(peripheral, response.error);
                break;
            case C.kStopScanning:
                this.onstopScan(response.error);
                break;
            case C.kConnect:
                if (response.params && response.params[C.kPeripheralUUID])
                    peripheral = this.peripherals[response.params[C.kPeripheralUUID]];
                if (!response.error) {
                    if (peripheral) {
                        peripheral.ondiscoverServices(response.params, response.error);
                        for (var suuid in response.params[C.kServices]) {
                            service = peripheral.services[suuid];
                            if (service) {
                                service.ondiscoverCharacteristics(response.params[C.kServices][suuid], response.error);
                                for (var cuuid in service.characteristics) {
                                    characteristic = service.characteristics[cuuid];
                                    if (characteristic) {
                                        characteristic.ondiscoverDescriptors(response.params[C.kServices][service.uuid][C.kCharacteristics][cuuid], response.error);
                                    } else {
                                        this.onerror("Characteristic not found");
                                    }
                                }
                            } else {
                                this.onerror("Service not found");
                            }
                        }
                        peripheral.onconnect();
                    } else {
                        this.onerror("Peripheral not found");
                    }
                } else {
                    if (peripheral)
                        peripheral.onconnect(response.error);
                }
                this.onconnect(peripheral, response.error);
                break;
            case C.kDisconnect:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.ondisconnect(response.error);
                    }
                }
                this.ondisconnect(gObject.peripheral, response.error);
                break;
            case C.kCentralState:
                this.state = response.params[C.kState];
                this.onstate(response.params[C.kState], response.error);
                break;
            case C.kGetServices:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.ondiscoverServices(response.params, response.error);
                    }
                }
                this.ondiscoverServices(gObject.peripheral, response.error);
                break;
            case C.kGetCharacteristics:
                if (response.params) {
                    gObject = this.getObjects('S', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.service) {
                        gObject.service.ondiscoverCharacteristics(response.params, response.error);
                    }
                }
                this.ondiscoverCharacteristics(gObject.peripheral, gObject.service, response.error);
                break;
            case C.kGetDescriptors:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.ondiscoverDescriptors(response.params, response.error);
                    }
                }
                this.ondiscoverDescriptors(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kGetCharacteristicValue:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.onread(response.params, response.error);
                    }
                }
                this.onupdateValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kWriteCharacteristicValue:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.onwrite(response.params, response.error);
                    }
                }
                this.onwriteValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kSetValueNotification:
                if (response.params) {
                    gObject = this.getObjects('C', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.characteristic) {
                        gObject.characteristic.isNotifying = response.params[C.kIsNotifying];
                        gObject.characteristic.value = response.params[C.kValue];
                    }
                }
                this.onupdateValue(gObject.peripheral, gObject.service, gObject.characteristic, response.error);
                break;
            case C.kGetDescriptorValue:
                if (response.params) {
                    gObject = this.getObjects('D', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.descriptor) {
                        gObject.descriptor.onread(response.params, response.error);
                    }
                }
                this.ondescriptorRead(gObject.peripheral, gObject.service, gObject.characteristic, gObject.descriptor, response.error);
                break;
            case C.kWriteDescriptorValue:
                if (response.params) {
                    gObject = this.getObjects('D', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.descriptor) {
                        gObject.descriptor.onwrite(response.params, response.error);
                    }
                }
                this.ondescriptorWrite(gObject.peripheral, gObject.service, gObject.characteristic, gObject.descriptor, response.error);
                break;
            case C.kGetRSSI:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.name = response.params[C.kPeripheralName];
                        gObject.peripheral.rssi = response.params[C.kRSSIkey];
                    }
                }
                this.onupdateRSSI(gObject.peripheral, response.error);
                break;
            case C.kPeripheralNameUpdate:
                if (response.params) {
                    gObject = this.getObjects('P', response.params[C.kPeripheralUUID], response.params[C.kServiceUUID], response.params[C.kCharacteristicUUID], response.params[C.kDescriptorUUID]);
                    if (gObject.peripheral) {
                        gObject.peripheral.name = response.params[C.kPeripheralName];
                        gObject.peripheral.rssi = response.params[C.kRSSIkey];
                    }
                }
                this.onupdateRSSI(gObject.peripheral, response.error);
                break;
            case C.kMessage:
                this.onMessage(response.params, response.error);
                break;
            default:
                this.onerror('invalid response');

                this.message = response;
        }
    };

    this.getObjects = function (type, peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID) {

        var resultObj = {};

        resultObj.peripheral = this.peripherals[peripheralUUID];
        if (resultObj.peripheral) {
            if (type === 'P') {
                return resultObj;
            }
            resultObj.service = resultObj.peripheral.services[serviceUUID];
            if (resultObj.service) {
                if (type === 'S') {
                    return resultObj;
                }
                resultObj.characteristic = resultObj.service.characteristics[characteristicUUID];
                if (resultObj.characteristic) {
                    if (type === 'C') {
                        return resultObj;
                    }
                    resultObj.descriptor = resultObj.characteristic.descriptors[descriptorUUID];
                    if (resultObj.descriptor) {
                        if (type === 'D') {
                            return resultObj;
                        } else {
                            console.log('getObjects: Type is not mentioned');
                        }
                    } else {
                        this.onerror('Descriptor not found');
                    }
                } else {
                    this.onerror('Characteristic not found');
                }
            } else {
                this.onerror('Service not found');
            }
        } else {
            this.onerror('Peripheral not found');
        }
        return resultObj;
    };

    this.oninit = function (params) {
    };

    this.configure = function (pwrAlert, centralID, callback) {
        if (callback) this.onconfigure = callback;

        var params = {};
        params[C.kShowPowerAlert] = pwrAlert;
        params[C.kIdentifierKey] = centralID;
        this.write(C.kConfigure, params);
    };

    this.onconfigure = function (params) {
    };

    this.scan = function (scanDuplicates, services, callback) {
        if (callback) this.onscan = callback;
        this.peripherals = {};
        var params = {};
        params[C.kScanOptionAllowDuplicatesKey] = scanDuplicates;
        params[C.kServiceUUIDs] = services;
        this.write(C.kScanForPeripherals, params);
    };

    this.onscan = function (params) {
    };

    this.stopScan = function (callback) {
        if (callback) this.onscan = callback;

        var params = {};
        this.write(C.kStopScanning, params);
    };

    this.onstopScan = function (params) {
    };

    this.centralState = function () {
        var params = {};
        this.write(C.kCentralState, params);
    };

    this.onstate = function (state) {
    };

    this.onupdateRSSI = function (peripheral) {
    };

    this.onerror = function (err_msg) {
        console.log(err_msg);
    };

    this.close = function (callback) {
        if (client) {
            client.close();
        }
    };

    this.onclose = function (params, error) {};

    this.ondescriptorRead = function (peripheral, service, characteristic, descriptor, error) {};

    this.ondescriptorWrite = function (peripheral, service, characteristic, descriptor, error) {};

    this.write = function (method, params, id) {
        var mesg = {};
        mesg.jsonrpc = "2.0";
        mesg.method = method;
        mesg.params = params;
        mesg.id = C.id.toString();
        C.id += 1;
        this.send(JSON.stringify(mesg));
    };

    this.send = function (mesg) {
        if (!client) {
            this.onerror("not connected");
            return;
        }
        if (client.readyState !== 1) {
            console.log('Socket is CLOSED');
            return;
        }
        client.send(mesg);
    };
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.GATTIP = GATTIP;
}
}).call(this,require('_process'))
},{"./constants.js":2,"./peripheral.js":7,"_process":20,"websocket":9}],6:[function(require,module,exports){
(function (process){
if(typeof process === 'object' && process + '' === '[object process]') {
	module.exports.GATTIP = require('./gattip').GATTIP;
	module.exports.GattIpServer = require('./gattip-server').GattIpServer;
}
}).call(this,require('_process'))
},{"./gattip":5,"./gattip-server":4,"_process":20}],7:[function(require,module,exports){
(function (process){
function Peripheral(gattip, name, uuid, addr, rssi, addata, scanData) {
    var path = "lib/gatt-ip-js/browser/"; // Replace the path to json configuration file.

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Service = require("./service.js").Service;
    }

    var _gattip = gattip;
    this.name = name;
    this.uuid = uuid;
    this.advertisementData = addata;
    this.scanData = scanData;
    this.serviceUUIDs = {};
    if (addata)this.rawAdvertisingData = addata[C.kRawAdvertisementData];
    this.manufacturerData = '';
    this.rssi = rssi;
    this.addr = addr;
    this.isConnected = false;
    this.services = {};

    this.serviceNames;
    this.characteristicNames;
    this.descriptorNames;

    var self = this;

    var flag = true;

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    //parse advertising data
    this.advdata = new Array();
    if (this.rawAdvertisingData) {
        if (this.rawAdvertisingData.length % 2 === 0) {
            for (var i = 0; i < this.rawAdvertisingData.length; i = i + 2) {
                this.advdata[i / 2] = this.rawAdvertisingData.charAt(i) + this.rawAdvertisingData.charAt(i + 1);
            }
        } else {
            for (var j = 0; j < this.rawAdvertisingData.length; j++) {
                this.advdata[j] = this.rawAdvertisingData.charAt(2 * j) + this.rawAdvertisingData.charAt(2 * j + 1);
            }
        }
    }

    do {
        if (this.advdata[1] == C.kGAP_ADTYPE_FLAGS) {
            getDiscoverable(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_POWER_LEVEL) {
            getTXLevel(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID) {
            getServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID) {
            getServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID || this.advdata[1] == C.kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID) {
            get128bitServiceUUIDs(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_MANUFACTURER_SPECIFIC) {
            getManufacturerData(this);
        } else if (this.advdata[1] == C.kGAP_ADTYPE_16BIT_SERVICE_DATA) {
            getServiceData(this);
        } else if (this.advdata[1] == "00") {
            this.advdata.splice(0, 1);
        } else {
            var advdataLength = parseInt(this.advdata[0], 16);
            this.advdata.splice(0, advdataLength + 1);
        }
        if (this.advdata.length === 0)
            flag = false;
    } while (flag);

    this.connect = function (callback) {
        if (callback) this.onconnect = callback;

        // TODO: Loading the JSON's for UUID names
        /* if (typeof $ === 'undefined') {
            $ = {
                getJSON : function (path, callback) {
                    var f = module.filename;
                    var load = f.substring(0, f.lastIndexOf('/')) + '/../../' + path;
                    var json = require(load);
                    callback(json);
                }
            }
        } */

        /* $.getJSON(path + "bleServices.json", function(res) {
            self.serviceNames = res;
            $.getJSON(path + "bleCharacteristics.json", function (res) {
                self.characteristicNames = res;
                $.getJSON(path + "bleDescriptors.json", function (res) {
                    self.descriptorNames = res;
                    
                });
            });
        }); */

        var params = {};
        params[C.kPeripheralUUID] = self.uuid;
        _gattip.write(C.kConnect, params);
    };

    this.onconnect = function (error) {
        if (!error) {
            this.isConnected = true;
        }
    };

    this.disconnect = function (callback) {
        if (callback) this.onconnect = callback;

        var params = {};
        params[C.kPeripheralUUID] = this.uuid;
        _gattip.write(C.kDisconnect, params);
    };

    this.ondisconnect = function (error) {
        if (!error) {
            console.log(this.name + ' disconnected');
            this.isConnected = false;
        }
    };

    this.discoverServices = function (callback) {
        if (callback) this.ondiscoverServices = callback;

        if (this.services && Object.size(this.services) > 0) {
            _gattip.ondiscoverServices(this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = this.uuid;
            _gattip.write(C.kGetServices, params);
        }
    };

    this.ondiscoverServices = function (params) {
        for (var index in params[C.kServices]) {
            var serviceUUID = params[C.kServices][index][C.kServiceUUID];
            var service = this.services[serviceUUID];
            if (!service) {
                service = new Service(_gattip, this, serviceUUID);
            }
            this.services[serviceUUID] = service;
        }
    };

    this.updateRSSI = function (callback) {
        if (callback) this.onupdateRSSI = callback;

        var params = {};
        params[C.kPeripheralUUID] = this.uuid;

        _gattip.write(C.kGetRSSI, params);
    };

    this.onupdateRSSI = function (params) {
        console.log("kGetRSSI event"); //TODO
    };

    this.discoverServicesRequest = function () {
        if(_gattip.discoverServicesRequest){
            _gattip.discoverServicesRequest(this);
        }else{
            throw Error('discoverServicesRequest method not implemented by server');
        }
    };

    this.discoverServicesResponse = function (error) {
        if(!error){
            params = {};
            var servicesArray = [];

            for (var uuid in this.services) {
                var obj = {};
                obj[C.kServiceUUID] = this.services[uuid].uuid;
                obj[C.kIsPrimaryKey] = this.services[uuid].isPrimary;
                servicesArray.push(obj);
            }
            params[C.kServices] = servicesArray;
            params[C.kPeripheralUUID] = this.uuid;
            _gattip.write(C.kGetServices, params);
        }else{
            _gattip.write(C.kGetServices, kError32603, error);
        }
    };

    this.addService = function (serviceUUID) {
        var service = new Service(_gattip, this, serviceUUID);
        this.services[service.uuid] = service;

        return service;
    };


    function getDiscoverable(peripheral) {
        var discoverableDataLength = parseInt(peripheral.advdata[0], 16);
        if (parseInt(peripheral.advdata[2], 16) >= 1) {
            peripheral.discoverable = "true";
        } else
            peripheral.discoverable = "false";
        peripheral.advdata.splice(0, discoverableDataLength + 1);
    }

    function getTXLevel(peripheral) {
        var txlevelDataLength = parseInt(peripheral.advdata[0], 16);
        peripheral.txpowerLevel = parseInt(peripheral.advdata[2]);
        peripheral.advdata.splice(0, txlevelDataLength + 1);
    }

    function getManufacturerData(peripheral) {
        var manufacturerDataLength = parseInt(peripheral.advdata[0], 16);
        for (var k = 2; k <= manufacturerDataLength; k++) {
            peripheral.manufacturerData += peripheral.advdata[k];
        }
        peripheral.advdata.splice(0, manufacturerDataLength + 1);
    }

    function getServiceUUIDs(peripheral) {
        var service16bitDataLength = parseInt(peripheral.advdata[0], 16);
        var reverse16bitUUID = '';
        for (var i = service16bitDataLength; i >= 2; i--) {
            reverse16bitUUID += peripheral.advdata[i];
        }
        peripheral.serviceUUIDs[0] = reverse16bitUUID;
        peripheral.advdata.splice(0, service16bitDataLength + 1);
    }

    function get128bitServiceUUIDs(peripheral) {
        var service128bitDataLength = parseInt(peripheral.advdata[0], 16);
        var reverse128bitUUID = '';
        for (var i = service128bitDataLength; i >= 2; i--) {
            reverse128bitUUID += peripheral.advdata[i];
            if (i == 14 || i == 12 || i == 10 || i == 8) {
                reverse128bitUUID += "-";
            }
        }
        peripheral.serviceUUIDs[0] = reverse128bitUUID;
        peripheral.advdata.splice(0, service128bitDataLength + 1);
    }

    function getServiceData(peripheral) {
        var serviceDataLength = parseInt(peripheral.advdata[0], 16);
        var eddystoneServiceUUID = '';
        for (var i = 3; i >= 2; i--) {
            eddystoneServiceUUID += peripheral.advdata[i];
        }
        if (eddystoneServiceUUID == 'FEAA') {
            if (parseInt(peripheral.advdata[4], 16) === 0) {
                getUID(peripheral);
            } else if (parseInt(peripheral.advdata[4], 16) == 16) {
                getURL(peripheral);
            } else if (parseInt(peripheral.advdata[4], 16) == 32) {
                getTLM(peripheral);
            }
        }
        peripheral.advdata.splice(0, serviceDataLength + 1);
    }

    function getUID(peripheral) {
        peripheral.frameType = 'UID';
        peripheral.nameSpace = '';
        peripheral.instanceID = '';
        peripheral.txpowerLevel = parseInt(peripheral.advdata[5], 16);
        for (var i = 6; i < 16; i++) {
            peripheral.nameSpace += peripheral.advdata[i];
        }
        for (var j = 16; j < 22; j++) {
            peripheral.instanceID += peripheral.advdata[j];
        }
        peripheral.reserved = peripheral.advdata[22];
        peripheral.reserved += peripheral.advdata[23];
    }

    function getURL(peripheral) {
        peripheral.frameType = 'URL';
        peripheral.txpowerLevel = parseInt(peripheral.advdata[5]);
        for (var protocol in C.AllProtocols) {
            if (advdata[6] == protocol)
                peripheral.url = C.AllProtocols[protocol];
        }
        for (var i = 7; i < advdataLength; i++) {
            peripheral.url += String.fromCharCode(parseInt(peripheral.advdata[i], 16));
        }
        for (var domain in C.AllDomains) {
            if (peripheral.advdata[advdataLength] == domain)
                peripheral.url += C.AllDomains[domain];
        }
    }

    function getTLM(peripheral) {
        peripheral.frameType = 'TLM';
        peripheral.advPacketCount = '';
        peripheral.timeInterval = '';
        peripheral.batteryVoltage = '';
        peripheral.eddyVersion = parseInt(peripheral.advdata[5], 16);
        for (var i = 6; i < 8; i++) {
            peripheral.batteryVoltage += peripheral.advdata[i];
        }
        peripheral.batteryVoltage = parseInt(peripheral.batteryVoltage, 16);
        peripheral.temperature = Math.ceil(parseInt(peripheral.advdata[8], 16));
        peripheral.temperature += '.';
        var temp = Math.ceil(((1 / 256) * parseInt(peripheral.advdata[9], 16)));
        if (temp.length > 2)
            peripheral.temperature += temp.toString().substring(0, 2);
        else
            peripheral.temperature += temp;
        for (var j = 10; j < 14; j++) {
            peripheral.advPacketCount += peripheral.advdata[j];
        }
        peripheral.advPacketCount = parseInt(peripheral.advPacketCount, 16);
        for (var k = 14; k < 18; k++) {
            peripheral.timeInterval += peripheral.advdata[k];
        }
        peripheral.timeInterval = Math.ceil(parseInt(peripheral.timeInterval, 16) * 0.1);
        peripheral.timePeriod = '';
        if (peripheral.timeInterval >= 60) {
            var days = Math.floor(peripheral.timeInterval / 86400);
            if (days > 0) {
                peripheral.timePeriod += days < 10 ? days + 'day ' : days + 'days ';
                peripheral.timeInterval -= days * 24 * 60 * 60;
            }
            var hours = Math.floor(peripheral.timeInterval / 3600);
            if (hours > 0) {
                peripheral.timePeriod += hours < 10 ? '0' + hours + ':' : hours + ':';
                peripheral.timeInterval -= hours * 60 * 60;
            } else
                peripheral.timePeriod += '00:';
            var min = Math.floor(peripheral.timeInterval / 60);
            if (min > 0) {
                peripheral.timePeriod += min < 10 ? '0' + min + ':' : min + ':';
                peripheral.timeInterval -= min * 60;
                peripheral.timePeriod += peripheral.timeInterval < 10 ? '0' + peripheral.timeInterval : peripheral.timeInterval;
                peripheral.timePeriod += ' secs';
                peripheral.timeInterval = 0;
            } else {
                peripheral.timePeriod += '00:' + peripheral.timeInterval;
                peripheral.timeInterval = 0;
            }
        } else if (peripheral.timeInterval > 0 && peripheral.timeInterval < 60) {
            peripheral.timePeriod += peripheral.timeInterval < 10 ? '00:00:0' + peripheral.timeInterval : '00:00:' + peripheral.timeInterval;
            peripheral.timePeriod += ' secs';
        }
    }

}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Peripheral = Peripheral;
}

}).call(this,require('_process'))
},{"./constants.js":2,"./service.js":8,"_process":20}],8:[function(require,module,exports){
(function (process){
function Service(gattip, peripheral, uuid) {

    if (typeof process === 'object' && process + '' === '[object process]') {
        C = require("./constants.js").C;
        Characteristic = require("./characteristic.js").Characteristic;
    }

    var _gattip = gattip;
    var _peripheral = peripheral;

    this.uuid = uuid;
    this.isPrimary = true; //TODO: read from remote
    this.characteristics = {};
    this.includedServices = {};
    this.serviceName = '';

    Object.size = function (obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    if (peripheral.serviceNames && peripheral.serviceNames[uuid]) {
        var uuidObj = peripheral.serviceNames[uuid];
        if (uuidObj !== undefined && uuidObj !== null) {
            this.serviceName = uuidObj.name;
        }
    }

    this.discoverIncludedServices = function (callback) {
    };

    this.ondiscoverIncludedServices = function (error) {
    };

    this.discoverCharacteristics = function (callback) {
        if (callback) this.ondiscoverCharacteristics = callback;

        if (this.characteristics && Object.size(this.characteristics) > 0) {
            _gattip.ondiscoverCharacteristics(_peripheral, this);
        } else {
            var params = {};
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = this.uuid;

            _gattip.write(C.kGetCharacteristics, params);
        }
    };

    this.ondiscoverCharacteristics = function (params) {
        for (var index in params[C.kCharacteristics]) {
            var characteristicUUID = params[C.kCharacteristics][index][C.kCharacteristicUUID];
            var characteristic = this.characteristics[characteristicUUID];
            if (!characteristic) {
                characteristic = new Characteristic(_gattip, _peripheral, this, characteristicUUID);
            }
            this.characteristics[characteristicUUID] = characteristic;

            characteristic.value = params[C.kCharacteristics][index][C.kValue];

            var props = params[C.kCharacteristics][index][C.kProperties];
            for (var apindex in C.AllProperties) {
                characteristic.properties[C.AllProperties[apindex]] = {
                    enabled: (props >> apindex) & 1,
                    name: C.AllProperties[apindex]
                };
            }

            characteristic.isNotifying = params[C.kCharacteristics][index][C.kIsNotifying];
        }
    };

    this.discoverCharacteristicsRequest = function () {
        if(_gattip.discoverCharacteristicsRequest){
            _gattip.discoverCharacteristicsRequest(_peripheral, this);
        }else{
            throw Error('discoverCharacteristicsRequest method not implemented by server');
        }
    };

    this.discoverCharacteristicsResponse = function (error) {
        if(!error){
            params = {};
            var charsArray = [];

            for (var uuid in this.characteristics) {
                var obj = {};
                obj[C.kCharacteristicUUID] = this.characteristics[uuid].uuid;
                obj[C.kProperties] = (this.characteristics[uuid].properties) ? this.characteristics[uuid].properties : '';
                obj[C.kValue] = this.characteristics[uuid].value;
                obj[C.kIsNotifying] = this.characteristics[uuid].isNotifying;
                charsArray.push(obj);
            }
            params[C.kCharacteristics] = charsArray;
            params[C.kPeripheralUUID] = _peripheral.uuid;
            params[C.kServiceUUID] = this.uuid;

            _gattip.write(C.kGetCharacteristics, params);
        }else{
            _gattip.write(C.kGetCharacteristics, kError32603, error);
        }        
    };

    this.addCharacteristic = function (characteristicUUID) {
        var characteristic = new Characteristic(_gattip, _peripheral, this, characteristicUUID);
        this.characteristics[characteristic.uuid] = characteristic;

        return characteristic;
    };
}

if ((typeof process === 'object' && process + '' === '[object process]') && (typeof exports !== 'undefined')) {
    exports.Service = Service;
}


}).call(this,require('_process'))
},{"./characteristic.js":1,"./constants.js":2,"_process":20}],9:[function(require,module,exports){
var _global = (function() { return this; })();
var nativeWebSocket = _global.WebSocket || _global.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new nativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new nativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}


/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : nativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":10}],10:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":11}],11:[function(require,module,exports){
module.exports={
  "_args": [
    [
      "websocket@latest",
      "/Users/kranti/Documents/workspace/Bitbucket/wb-polyfill"
    ]
  ],
  "_from": "websocket@latest",
  "_id": "websocket@1.0.22",
  "_inCache": true,
  "_installable": true,
  "_location": "/websocket",
  "_nodeVersion": "3.3.1",
  "_npmUser": {
    "email": "brian@worlize.com",
    "name": "theturtle32"
  },
  "_npmVersion": "2.14.3",
  "_phantomChildren": {},
  "_requested": {
    "name": "websocket",
    "raw": "websocket@latest",
    "rawSpec": "latest",
    "scope": null,
    "spec": "latest",
    "type": "tag"
  },
  "_requiredBy": [
    "/",
    "/gatt-ip"
  ],
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.22.tgz",
  "_shasum": "8c33e3449f879aaf518297c9744cebf812b9e3d8",
  "_shrinkwrap": null,
  "_spec": "websocket@latest",
  "_where": "/Users/kranti/Documents/workspace/Bitbucket/wb-polyfill",
  "author": {
    "email": "brian@worlize.com",
    "name": "Brian McKelvey",
    "url": "https://www.worlize.com/"
  },
  "browser": "lib/browser.js",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "config": {
    "verbose": false
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "dependencies": {
    "debug": "~2.2.0",
    "nan": "~2.0.5",
    "typedarray-to-buffer": "~3.0.3",
    "yaeti": "~0.0.4"
  },
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "devDependencies": {
    "buffer-equal": "^0.0.1",
    "faucet": "^0.0.1",
    "gulp": "git+https://github.com/gulpjs/gulp.git#4.0",
    "gulp-jshint": "^1.11.2",
    "jshint-stylish": "^1.0.2",
    "tape": "^4.0.1"
  },
  "directories": {
    "lib": "./lib"
  },
  "dist": {
    "shasum": "8c33e3449f879aaf518297c9744cebf812b9e3d8",
    "tarball": "https://registry.npmjs.org/websocket/-/websocket-1.0.22.tgz"
  },
  "engines": {
    "node": ">=0.8.0"
  },
  "gitHead": "19108bbfd7d94a5cd02dbff3495eafee9e901ca4",
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "keywords": [
    "RFC-6455",
    "client",
    "comet",
    "networking",
    "push",
    "realtime",
    "server",
    "socket",
    "websocket",
    "websockets"
  ],
  "license": "Apache-2.0",
  "main": "index",
  "maintainers": [
    {
      "name": "theturtle32",
      "email": "brian@worlize.com"
    }
  ],
  "name": "websocket",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "scripts": {
    "gulp": "gulp",
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit"
  },
  "version": "1.0.22"
}

},{}],12:[function(require,module,exports){
//# browser shim for navigator
var match,
    pl = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
        return decodeURIComponent(s.replace(pl, " "));
    },
    query = window.location.search.substring(1);

var urlParams = {};
while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);

var gatewayToken = urlParams['token'];
var deviceUUID = urlParams['uuid'];

var getBlueAppBluetoothObject = function () {

    if (typeof window.bawb != 'object') {
        function handleError(error) {
            console.log("Bluetooth Error:", error, error.stack);
        }

        window.bawb = require('./index.js').init({
            GATTIP: GATTIP,
            gatewayToken: gatewayToken,
            deviceUUID: deviceUUID,
            onError: handleError,
            onReady: function () {
            }
        }).navigator.bluetooth;
    }

    return window.bawb;
};

if (typeof window === 'object' && typeof navigator === 'object') {

    if (!gatewayToken || !deviceUUID) {
        //don't do anything if we don't have these values
    } else if (Object.defineProperty) {
        Object.defineProperty(navigator, "bluetooth", {
            get: getBlueAppBluetoothObject
        });
    } else if (Object.prototype.__defineGetter__) {
        navigator.__defineGetter__("bluetooth", getBlueAppBluetoothObject);
    }
}
},{"./index.js":13}],13:[function(require,module,exports){
"use strict";
var util = require('./util.js');
var thirdparty = require('./thirdparty');
var BluetoothDevice = require('./wb-device').BluetoothDevice;

module.exports.navigator = undefined;
module.exports.window = undefined;

function BlueAppWebBluetooth(g) {
    //expose the g as gateway
    this.gateway = g;
}

BlueAppWebBluetooth.prototype.requestDevice = function (requestDeviceOptions) {
    var filters = requestDeviceOptions.filters;
    var g = this.gateway;
    return new Promise(function (fulfill, reject) {
        var timeout = setTimeout(function () {
            reject('Timed out');
        }, 30000);
        g.onscan = function (peripheral) {
            if (undefined == peripheral) {
                console.error("Got error from scan!");
                return;
            }
            console.log(peripheral.name);
            for (var filter of filters) {

                var processedFilterName = '', processedPeriName = '.';
                if(filter.name && peripheral.name) {
                    processedFilterName = filter.name.toUpperCase();
                    processedPeriName = peripheral.name.toUpperCase();
                }
                if (processedPeriName.indexOf(processedFilterName) > -1) {
                    clearTimeout(timeout);
                    g.stopScan();
                    console.log("FOUND", peripheral.name);
                    let dev = new BluetoothDevice(g, peripheral);
                    fulfill(dev);
                    g.onscan = function () {
                        console.warn("Got scan result, but none was requested");
                    }
                }
                // TODO: Better error checking
                if (filter.services && filter.services.length > 0) {
                    let servicesFilter = filter.services.map(util.toVensiUUID);
                    // convert object to array Object.keys(obj).map(key => obj[key])
                    let uuids = Object.keys(peripheral.serviceUUIDs).map(key => peripheral.serviceUUIDs[key]);
                    let intersect = uuids.filter(x => {
                        for (var y of servicesFilter) {
                            if (y === x) {
                                return true;
                            }
                        }
                        return false;
                    });
                    if (intersect.length > 0) {
                        //TODO: do this per spec
                        //TODO: Support optionalServices
                        clearTimeout(timeout);
                        g.stopScan();
                        console.log("FOUND", peripheral.name);
                        let dev = new BluetoothDevice(g, peripheral);
                        console.warn("WARN: Doing hacked a up filter match");
                        fulfill(dev);
                        g.onscan = function () {
                            console.warn("Got scan result, but none was requested");
                        }
                    }

                }
            }
        };
        g.scan();
    });
};


module.exports.init = function (config) {

    var window = {};
    window.bluetooth = {};
    window.BluetoothUUID = thirdparty.BluetoothUUID;

    if (!config) {
        config = {};
    }

    if (typeof config.GATTIP !== 'function') {
        config.GATTIP = require('gatt-ip').GATTIP;
    }
    var g = new config.GATTIP();
    g.BluetoothUUID = thirdparty.BluetoothUUID;

    var navigator = {};
    navigator.bluetooth = new BlueAppWebBluetooth(g);

    var host = 'localhost';
    var port = 6001;

    if (config.gatewayToken && config.deviceUUID) {
        g.init('ws://dev-proxy.blueapp.io');

        g.oninit = function (params, error) {
            var intro = {
                type: 'authenticate',
                access_token: config.gatewayToken
            };

            g.send(JSON.stringify(intro));
        };

        g.onMessage = function (params, error) {
            if (params.isAuthenticated === true) {
                g.configure(true);
            } else {
                //toaster.show("","Authentication failed with Proxy Server.","error");
                alert('Authentication failed with Proxy Server.');
                g.close();
            }
        };

    } else {
        g.init('ws://' + host + ':' + port);

        g.oninit = function (params, error) {
            g.configure(true);
        };
    }

    g.onconfigure = function (params, error) {
        g.centralState();
    };

    g.origScan = g.scan;

    g.scan = function (dups, services, callback) {
        //to do, check if connection is established and then do scan, else pause here
        var origOnScan = g.onscan;
        g.origScan(dups, services, function (peripheral, error) {
            if (peripheral.uuid === config.deviceUUID) {
                origOnScan(peripheral, error);
            }
        });
    };

    //till here

    g.onerror = function (err) {
        if (config.onError) {
            config.onError(err);
        } else {
            console.log("GattIP Error:", err_msg);
        }
    };

    g.onstate = function (error) {
        console.log("Central state = ", g.state);
        if (g.state === C.kPoweredOn) {
            config.onReady();
            return;

        } else if (g.state === C.kPoweredOff) {
            //Error -- BLE is powered off
        } else if (g.state === C.kUnsupported) {
            //Error -- BLE is not supported
        } else {
            //TODO: other error cases
        }
        g.centralState();

    };

    g.onupdateValue = function (peripheral, service, characteristic, error) {
        console.error("Hack alert: OnUpdate value not needed/requested");
    };

    g.onwriteValue = function (peripheral, service, characteristic, error) {
        console.error("Hack alert: OnWrite value not needed/requested");
    };

    return {
        navigator: navigator,
        window: window
    };
};

/* nik: why these?
 window.BluetoothDevice = BluetoothDevice;
 window.BluetoothDevice = polyfill.BluetoothDevice;

 window.BluetoothGattService = polyfill.BluetoothGattService;
 window.BluetoothGattCharacteristic = polyfill.BluetoothGattCharacteristic;
 window.BluetoothGattDescriptor = polyfill.BluetoothGattDescriptor;


 window.BluetoothUUID.getService = polyfill.ResolveUUIDName('service');
 window.BluetoothUUID.getCharacteristic = polyfill.ResolveUUIDName('characteristic');
 window.BluetoothUUID.getDescriptor = polyfill.ResolveUUIDName('descriptor');
 */


},{"./thirdparty":14,"./util.js":15,"./wb-device":18,"gatt-ip":6}],14:[function(require,module,exports){
/**
 *
 Copyright 2014 Google Inc. All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.


 This work is a derivative of https://github.com/WebBluetoothCG/chrome-app-polyfill/
 */

var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function canonicalUUID (uuidAlias) {
    uuidAlias >>>= 0;  // Make sure the number is positive and 32 bits.
    var strAlias = "0000000" + uuidAlias.toString(16);
    strAlias = strAlias.substr(-8);
    return strAlias + "-0000-1000-8000-00805f9b34fb"
}

function ResolveUUIDName(tableName) {
    var table = module.exports.BluetoothUUID[tableName];
    return function(name) {
        if(typeof name !== "number"){
            name = name.toLowerCase();
        }
        if (typeof name==="number") {
            return canonicalUUID(name);
        } else if (uuidRegex.test(name)) {
            return name;
        } else if (table.hasOwnProperty(name)) {
            return table[name];
        } else {
            throw new NamedError('SyntaxError', '"' + name + '" is not a known '+tableName+' name.');
        }
    }
}

module.exports.BluetoothUUID={};
module.exports.BluetoothUUID.canonicalUUID = canonicalUUID;
module.exports.BluetoothUUID.service = {
    alert_notification: canonicalUUID(0x1811),
    automation_io: canonicalUUID(0x1815),
    battery_service: canonicalUUID(0x180F),
    blood_pressure: canonicalUUID(0x1810),
    body_composition: canonicalUUID(0x181B),
    bond_management: canonicalUUID(0x181E),
    continuous_glucose_monitoring: canonicalUUID(0x181F),
    current_time: canonicalUUID(0x1805),
    cycling_power: canonicalUUID(0x1818),
    cycling_speed_and_cadence: canonicalUUID(0x1816),
    device_information: canonicalUUID(0x180A),
    environmental_sensing: canonicalUUID(0x181A),
    generic_access: canonicalUUID(0x1800),
    generic_attribute: canonicalUUID(0x1801),
    glucose: canonicalUUID(0x1808),
    health_thermometer: canonicalUUID(0x1809),
    heart_rate: canonicalUUID(0x180D),
    human_interface_device: canonicalUUID(0x1812),
    immediate_alert: canonicalUUID(0x1802),
    indoor_positioning: canonicalUUID(0x1821),
    internet_protocol_support: canonicalUUID(0x1820),
    link_loss: canonicalUUID(0x1803 ),
    location_and_navigation: canonicalUUID(0x1819),
    next_dst_change: canonicalUUID(0x1807),
    phone_alert_status: canonicalUUID(0x180E),
    pulse_oximeter: canonicalUUID(0x1822),
    reference_time_update: canonicalUUID(0x1806),
    running_speed_and_cadence: canonicalUUID(0x1814),
    scan_parameters: canonicalUUID(0x1813),
    tx_power: canonicalUUID(0x1804),
    user_data: canonicalUUID(0x181C),
    weight_scale: canonicalUUID(0x181D)
};


module.exports.BluetoothUUID.characteristic = {
    "aerobic_heart_rate_lower_limit": canonicalUUID(0x2A7E),
    "aerobic_heart_rate_upper_limit": canonicalUUID(0x2A84),
    "aerobic_threshold": canonicalUUID(0x2A7F),
    "age": canonicalUUID(0x2A80),
    "aggregate": canonicalUUID(0x2A5A),
    "alert_category_id": canonicalUUID(0x2A43),
    "alert_category_id_bit_mask": canonicalUUID(0x2A42),
    "alert_level": canonicalUUID(0x2A06),
    "alert_notification_control_point": canonicalUUID(0x2A44),
    "alert_status": canonicalUUID(0x2A3F),
    "altitude": canonicalUUID(0x2AB3),
    "anaerobic_heart_rate_lower_limit": canonicalUUID(0x2A81),
    "anaerobic_heart_rate_upper_limit": canonicalUUID(0x2A82),
    "anaerobic_threshold": canonicalUUID(0x2A83),
    "analog": canonicalUUID(0x2A58),
    "apparent_wind_direction": canonicalUUID(0x2A73),
    "apparent_wind_speed": canonicalUUID(0x2A72),
    "gap.appearance": canonicalUUID(0x2A01),
    "barometric_pressure_trend": canonicalUUID(0x2AA3),
    "battery_level": canonicalUUID(0x2A19),
    "blood_pressure_feature": canonicalUUID(0x2A49),
    "blood_pressure_measurement": canonicalUUID(0x2A35),
    "body_composition_feature": canonicalUUID(0x2A9B),
    "body_composition_measurement": canonicalUUID(0x2A9C),
    "body_sensor_location": canonicalUUID(0x2A38),
    "bond_management_control_point": canonicalUUID(0x2AA4),
    "bond_management_feature": canonicalUUID(0x2AA5),
    "boot_keyboard_input_report": canonicalUUID(0x2A22),
    "boot_keyboard_output_report": canonicalUUID(0x2A32),
    "boot_mouse_input_report": canonicalUUID(0x2A33),
    "gap.central_address_resolution_support": canonicalUUID(0x2AA6),
    "cgm_feature": canonicalUUID(0x2AA8),
    "cgm_measurement": canonicalUUID(0x2AA7),
    "cgm_session_run_time": canonicalUUID(0x2AAB),
    "cgm_session_start_time": canonicalUUID(0x2AAA),
    "cgm_specific_ops_control_point": canonicalUUID(0x2AAC),
    "cgm_status": canonicalUUID(0x2AA9),
    "csc_feature": canonicalUUID(0x2A5C),
    "csc_measurement": canonicalUUID(0x2A5B),
    "current_time": canonicalUUID(0x2A2B),
    "cycling_power_control_point": canonicalUUID(0x2A66),
    "cycling_power_feature": canonicalUUID(0x2A65),
    "cycling_power_measurement": canonicalUUID(0x2A63),
    "cycling_power_vector": canonicalUUID(0x2A64),
    "database_change_increment": canonicalUUID(0x2A99),
    "date_of_birth": canonicalUUID(0x2A85),
    "date_of_threshold_assessment": canonicalUUID(0x2A86),
    "date_time": canonicalUUID(0x2A08),
    "day_date_time": canonicalUUID(0x2A0A),
    "day_of_week": canonicalUUID(0x2A09),
    "descriptor_value_changed": canonicalUUID(0x2A7D),
    "gap.device_name": canonicalUUID(0x2A00),
    "dew_point": canonicalUUID(0x2A7B),
    "digital": canonicalUUID(0x2A56),
    "dst_offset": canonicalUUID(0x2A0D),
    "elevation": canonicalUUID(0x2A6C),
    "email_address": canonicalUUID(0x2A87),
    "exact_time_256": canonicalUUID(0x2A0C),
    "fat_burn_heart_rate_lower_limit": canonicalUUID(0x2A88),
    "fat_burn_heart_rate_upper_limit": canonicalUUID(0x2A89),
    "firmware_revision_string": canonicalUUID(0x2A26),
    "first_name": canonicalUUID(0x2A8A),
    "five_zone_heart_rate_limits": canonicalUUID(0x2A8B),
    "floor_number": canonicalUUID(0x2AB2),
    "gender": canonicalUUID(0x2A8C),
    "glucose_feature": canonicalUUID(0x2A51),
    "glucose_measurement": canonicalUUID(0x2A18),
    "glucose_measurement_context": canonicalUUID(0x2A34),
    "gust_factor": canonicalUUID(0x2A74),
    "hardware_revision_string": canonicalUUID(0x2A27),
    "heart_rate_control_point": canonicalUUID(0x2A39),
    "heart_rate_max": canonicalUUID(0x2A8D),
    "heart_rate_measurement": canonicalUUID(0x2A37),
    "heat_index": canonicalUUID(0x2A7A),
    "height": canonicalUUID(0x2A8E),
    "hid_control_point": canonicalUUID(0x2A4C),
    "hid_information": canonicalUUID(0x2A4A),
    "hip_circumference": canonicalUUID(0x2A8F),
    "humidity": canonicalUUID(0x2A6F),
    "ieee_11073-20601_regulatory_certification_data_list": canonicalUUID(0x2A2A),
    "indoor_positioning_configuration": canonicalUUID(0x2AAD),
    "intermediate_blood_pressure": canonicalUUID(0x2A36),
    "intermediate_temperature": canonicalUUID(0x2A1E),
    "irradiance": canonicalUUID(0x2A77),
    "language": canonicalUUID(0x2AA2),
    "last_name": canonicalUUID(0x2A90),
    "latitude": canonicalUUID(0x2AAE),
    "ln_control_point": canonicalUUID(0x2A6B),
    "ln_feature": canonicalUUID(0x2A6A),
    "local_east_coordinate.xml": canonicalUUID(0x2AB1),
    "local_north_coordinate": canonicalUUID(0x2AB0),
    "local_time_information": canonicalUUID(0x2A0F),
    "location_and_speed": canonicalUUID(0x2A67),
    "location_name": canonicalUUID(0x2AB5),
    "longitude": canonicalUUID(0x2AAF),
    "magnetic_declination": canonicalUUID(0x2A2C),
    "magnetic_flux_density_2D": canonicalUUID(0x2AA0),
    "magnetic_flux_density_3D": canonicalUUID(0x2AA1),
    "manufacturer_name_string": canonicalUUID(0x2A29),
    "maximum_recommended_heart_rate": canonicalUUID(0x2A91),
    "measurement_interval": canonicalUUID(0x2A21),
    "model_number_string": canonicalUUID(0x2A24),
    "navigation": canonicalUUID(0x2A68),
    "new_alert": canonicalUUID(0x2A46),
    "gap.peripheral_preferred_connection_parameters": canonicalUUID(0x2A04),
    "gap.peripheral_privacy_flag": canonicalUUID(0x2A02),
    "plx_continuous_measurement": canonicalUUID(0x2A5F),
    "plx_features": canonicalUUID(0x2A60),
    "plx_spot_check_measurement": canonicalUUID(0x2A5E),
    "pnp_id": canonicalUUID(0x2A50),
    "pollen_concentration": canonicalUUID(0x2A75),
    "position_quality": canonicalUUID(0x2A69),
    "pressure": canonicalUUID(0x2A6D),
    "protocol_mode": canonicalUUID(0x2A4E),
    "rainfall": canonicalUUID(0x2A78),
    "gap.reconnection_address": canonicalUUID(0x2A03),
    "record_access_control_point": canonicalUUID(0x2A52),
    "reference_time_information": canonicalUUID(0x2A14),
    "report": canonicalUUID(0x2A4D),
    "report_map": canonicalUUID(0x2A4B),
    "resting_heart_rate": canonicalUUID(0x2A92),
    "ringer_control_point": canonicalUUID(0x2A40),
    "ringer_setting": canonicalUUID(0x2A41),
    "rsc_feature": canonicalUUID(0x2A54),
    "rsc_measurement": canonicalUUID(0x2A53),
    "sc_control_point": canonicalUUID(0x2A55),
    "scan_interval_window": canonicalUUID(0x2A4F),
    "scan_refresh": canonicalUUID(0x2A31),
    "sensor_location": canonicalUUID(0x2A5D),
    "serial_number_string": canonicalUUID(0x2A25),
    "gatt.service_changed": canonicalUUID(0x2A05),
    "software_revision_string": canonicalUUID(0x2A28),
    "sport_type_for_aerobic_and_anaerobic_thresholds": canonicalUUID(0x2A93),
    "supported_new_alert_category": canonicalUUID(0x2A47),
    "supported_unread_alert_category": canonicalUUID(0x2A48),
    "system_id": canonicalUUID(0x2A23),
    "temperature": canonicalUUID(0x2A6E),
    "temperature_measurement": canonicalUUID(0x2A1C),
    "temperature_type": canonicalUUID(0x2A1D),
    "three_zone_heart_rate_limits": canonicalUUID(0x2A94),
    "time_accuracy": canonicalUUID(0x2A12),
    "time_source": canonicalUUID(0x2A13),
    "time_update_control_point": canonicalUUID(0x2A16),
    "time_update_state": canonicalUUID(0x2A17),
    "time_with_dst": canonicalUUID(0x2A11),
    "time_zone": canonicalUUID(0x2A0E),
    "true_wind_direction": canonicalUUID(0x2A71),
    "true_wind_speed": canonicalUUID(0x2A70),
    "two_zone_heart_rate_limit": canonicalUUID(0x2A95),
    "tx_power_level": canonicalUUID(0x2A07),
    "uncertainty": canonicalUUID(0x2AB4),
    "unread_alert_status": canonicalUUID(0x2A45),
    "user_control_point": canonicalUUID(0x2A9F),
    "user_index": canonicalUUID(0x2A9A),
    "uv_index": canonicalUUID(0x2A76),
    "vo2_max": canonicalUUID(0x2A96),
    "waist_circumference": canonicalUUID(0x2A97),
    "weight": canonicalUUID(0x2A98),
    "weight_measurement": canonicalUUID(0x2A9D),
    "weight_scale_feature": canonicalUUID(0x2A9E),
    "wind_chill": canonicalUUID(0x2A79)
};

module.exports.BluetoothUUID.descriptor = {
    "gatt.characteristic_extended_properties": canonicalUUID(0x2900),
    "gatt.characteristic_user_description": canonicalUUID(0x2901),
    "gatt.client_characteristic_configuration": canonicalUUID(0x2902),
    "gatt.server_characteristic_configuration": canonicalUUID(0x2903),
    "gatt.characteristic_presentation_format": canonicalUUID(0x2904),
    "gatt.characteristic_aggregate_format": canonicalUUID(0x2905),
    "valid_range": canonicalUUID(0x2906),
    "external_report_reference": canonicalUUID(0x2907),
    "report_reference": canonicalUUID(0x2908),
    "value_trigger_setting": canonicalUUID(0x290A),
    "es_configuration": canonicalUUID(0x290B),
    "es_measurement": canonicalUUID(0x290C),
    "es_trigger_setting": canonicalUUID(0x290D)
};

module.exports.BluetoothUUID.getService = ResolveUUIDName('service');
module.exports.BluetoothUUID.getCharacteristic = ResolveUUIDName('characteristic');
module.exports.BluetoothUUID.getDescriptor = ResolveUUIDName('descriptor');

},{}],15:[function(require,module,exports){
var SHORT_UUID_SUFFFIX = '-0000-1000-8000-00805F9B34FB';
function toShortUUID(uuidStr) {
    if (uuidStr.indexOf(SHORT_UUID_SUFFFIX) == 8) {
        if (uuidStr.indexOf('0000') == 0) {
            return uuidStr.substring(4, 8);
        } else {
            return uuidStr.substring(0, 8);
        }
    } else {
        return uuidStr;
    }
}
module.exports.toVensiUUID = function (uuid) {
    switch (typeof uuid) {
        case 'string':
            return toShortUUID(uuid.toUpperCase());
            break;
        case 'number':
            return Number(uuid).toString(16).toUpperCase();
            break;
        default:
            console.warn('Unable to convert uuid ' + uuid + ' to hex string');
            return undefined;
    }
};

module.exports.toWbUUID = function (uuid) {
    if (uuid) {
        uuid = uuid.toLowerCase();
    }
    return uuid;
};

module.exports.hexAsArray = function (hex) {
    var bytes = [];
    if (hex.length % 2 == 1) {
        hex = "0" + hex;
    }
    for (var i = 0; i < hex.length - 1; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
};

module.exports.arrayAsHex = function (array) {
    var ret = '';
    for (var byte of array) {
        var value = (byte & 0xFF).toString(16);
        if (value.length == 1) {
            value = '0' + value;
        }
        ret += value;
    }
    return ret.toUpperCase();
};

module.exports.uncaughtError = function (error) {
    console.error("Uncaught error:", error, error.stack);
};

module.exports.errorLoggingPromise = function (func) {
    return new Promise(function (fulfill, reject) {
        try {
            func(fulfill, reject);
        } catch (error) {
            module.exports.uncaughtError(error);
            throw error;
        }
    });
};


},{}],16:[function(require,module,exports){
var util = require('./util.js');
var BluetoothGattDescriptor = require('./wb-descriptor').BluetoothGattDescriptor;

var WB_PROPERTIES = ['broadcast', 'read', 'writeWithoutResponse', 'write', 'notify', 'indicate', 'authenticatedSignedWrites', 'reliableWrite', 'writableAuxiliaries'];

function BluetoothGattCharacteristic(webBluetoothService, gattipCharacteristic) {
    this._gattIp = webBluetoothService._gattIp;
    this._service = webBluetoothService;
    this._gattipCharacteristic = gattipCharacteristic;
    this._properties = new BluetoothCharacteristicProperties(gattipCharacteristic.properties);
    this._value = null;
    this._isNotifying = false;
}
module.exports.BluetoothGattCharacteristic = BluetoothGattCharacteristic;

function BluetoothCharacteristicProperties(gattIpProperties) {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // TODO: Implement WB spec 5.4.1. What to do about differences like missing reliableWrite or writableAuxiliaries, or the missing  NotifyEncryptionRequired etc.
    for (var wbPropName of WB_PROPERTIES) {
        //noinspection JSUnfilteredForInLoop
        var gattIpPropName = capitalizeFirstLetter(wbPropName);
        if ('object' == typeof gattIpProperties[gattIpPropName]) {
            //noinspection JSUnfilteredForInLoop
            this[wbPropName] = (gattIpProperties[gattIpPropName].enabled == 1);
        } else if (wbPropName == 'reliableWrite' || wbPropName == 'writableAuxiliaries') {
            if (0 === gattIpProperties['ExtendedProperties'].enabled) {
                //noinspection JSUnfilteredForInLoop
                this[wbPropName] = false;
            } else {
                console.error('WB spec 5.4.1 section not fully implemented.');
                //noinspection JSUnfilteredForInLoop
                this[wbPropName] = false;
            }
        }
    }
}

BluetoothGattCharacteristic.prototype = {
    get uuid() {
        return util.toWbUUID(this._gattipCharacteristic.uuid);
    },
    get service() {
        return this._service;
    },
    get properties() {
        return this._properties;
    },
    get value() {
        return this._value;
    },

    getAllDescriptors: function (descriptorUuids) {
        return util.errorLoggingPromise(function (fulfill, reject) {
            // TODO
            reject("Not implemented");
        });
    },

    getDescriptor: function (descriptorUuid) {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            var vensiUuid = util.toVensiUUID(self._gattIp.BluetoothUUID.getDescriptor(descriptorUuid));
            if ('undefined' == typeof vensiUuid) {
                reject("Unable to find descriptor with requested UUID " + descriptorUuid)
            } else {
                var desc = self._gattipCharacteristic.descriptors[vensiUuid];
                if (desc) {
                    fulfill(new BluetoothGattDescriptor(self, desc));
                } else {
                    reject("Descriptor " + descriptorUuid + " not found");
                }
            }
        });
    },

    readValue: function () {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            //TODO HACK: params should not be passed to the function
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };

            self._gattipCharacteristic.read(function (params) {
                console.warn("Hack alert: Reading internal gattip structure");
                var gvalue = params["bp"];
                self._isNotifying = params["bx"];
                if (gvalue) {
                    var arr = util.hexAsArray(gvalue);
                    fulfill(new DataView(new Uint8Array(arr).buffer));
                } else {
                    reject("Unable to obtain value");
                }
            });
        });
    },

    writeValue: function (newValue) {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            var gvalue = util.arrayAsHex(Array.prototype.slice.call(newValue));
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };
            self._gattipCharacteristic.write(gvalue, function (params) {
                fulfill();
            });
            console.warn("HACK ALERT: Need to fix gatt server for write without response");
            if (self._gattipCharacteristic.properties["WriteWithoutResponse"].enabled == 1 || self._gattipCharacteristic.properties["Indicate"].enabled == 1) {
                fulfill();
            }
        });
    },

    startNotifications: function () {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            if (self._isNotifying) {
                fulfill();
                return;
            }
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };
            self._gattipCharacteristic.notify(true, function (params) {
                self._isNotifying = true;
                fulfill();
            });
            // TODO: Do the actual notifications
        });
    },

    stopNotifications: function () {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            if (!self._isNotifying) {
                fulfill();
                return;
            }
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };
            self._gattipCharacteristic.notify(false, function (params) {
                self._isNotifying = false;
                fulfill();
            });
            // TODO: Do/stop the actual notifications
        });
    }
};


},{"./util.js":15,"./wb-descriptor":17}],17:[function(require,module,exports){
var util = require('./util.js');
function BluetoothGattDescriptor(webBluetoothCharacteristic, gattIpDescriptor) {
    this._gattIp = webBluetoothCharacteristic._gattIp;
    this._characteristic = webBluetoothCharacteristic;
    this._gattIpDescriptor = gattIpDescriptor;
    this._value = null;
}
module.exports.BluetoothGattDescriptor = BluetoothGattDescriptor;

BluetoothGattDescriptor.prototype = {
    get uuid() {
        return util.toWbUUID(this._gattIpDescriptor.uuid);
    },
    get characteristic() {
        return this._characteristic;
    },
    get value() {
        return this._value;
    },
    readValue: function () {
        var self = this;
        self._gattIp.onerror = function (error) {
            self._gattIp.onerror = util.uncaughtError;
            reject(error);
        };
        //TODO HACK: params should not be passed to the function
        self._gattIpDescriptor.read(function (params) {
            console.warn("Hack alert: Reading internal gattip structure");
            var gvalue = params["bp"];
            if (gvalue) {
                var arr = util.hexAsArray(gvalue);
                fulfill(new DataView(new Uint8Array(arr).buffer));
            } else {
                reject("Unable to obtain value");
            }
        });
    },
    writeValue: function (newValue) {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };
            var gvalue = util.arrayAsHex(Array.prototype.slice.call(newValue));
            self._gattIpDescriptor.write(gvalue, function (params) {
                fulfill();
            });
        });
    }
};

},{"./util.js":15}],18:[function(require,module,exports){
var util = require('./util.js');
var BluetoothGattService = require('./wb-service').BluetoothGattService;

function BluetoothDevice(gattIp, gattIpPeripheral) {
    this._gattIp = gattIp;
    this._gattIpPeripheral = gattIpPeripheral;
}

module.exports.BluetoothDevice = BluetoothDevice;

BluetoothDevice.prototype = {

    get name() {
        return this._gattIpPeripheral.name;
    },
    get deviceClass() {
        return undefined;
    },
    get vendorIdSource() {
        return undefined;
    },
    get vendorId() {
        return undefined;
    },
    get productId() {
        return undefined;
    },
    get productVersion() {
        return undefined;
    },
    get paired() {
        // TODO: Huh?
        return false;
    },
    get connected() {
        return this._gattIpPeripheral.isConnected;
    },
    get uuids() {
        // TODO: Fix format of UUIDs
        return this._gattIpPeripheral.serviceUUIDs;
    },

    connect: function () {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            self._gattIp.onerror = function (error) {
                self._gattIp.onerror = util.uncaughtError;
                reject(error);
            };
            var timeout = setTimeout(function () {
                reject('Timed out');
            }, 30000);
            self._gattIp.onconnect = function () {
                self._gattIpPeripheral = self._gattIp.peripherals[self._gattIpPeripheral.uuid];
                fulfill(self);
            };
            self._gattIp.onerror = function (error) {
                reject(error);
            };
            self._gattIpPeripheral.connect();
        });
    },

    disconnect: function () {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            self._gattIp.ondisconnect = function () {
                fulfill(self);
            };
            self._gattIp.onerror = function (error) {
                reject(error);
            };
            self._gattIpPeripheral.disconnect();
        });
    },

    getAllServices: function (serviceUuids) {
        return util.errorLoggingPromise(function (fulfill, reject) {
            // TODO
            reject("Not implemented");
        });
    },

    getService: function (serviceUuid) {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            var vensiUuid = util.toVensiUUID(self._gattIp.BluetoothUUID.getService(serviceUuid));
            if ('undefined' == typeof vensiUuid) {
                reject("Unable to find service with requested UUID " + serviceUuid)
            } else {
                var svc = self._gattIpPeripheral.services[vensiUuid];
                if (svc) {
                    fulfill(new BluetoothGattService(self, svc));
                } else {
                    var svc = self._gattIpPeripheral.services[serviceUuid];
                    if (svc) {
                        fulfill(new BluetoothGattService(self, svc));
                    } else {
                        reject("Service " + serviceUuid + " not found");
                    }
                }
            }
        });
    }
};
BluetoothDevice.prototype.connectGATT = BluetoothDevice.prototype.connect;
BluetoothDevice.prototype.getPrimaryService = BluetoothDevice.prototype.getService;

},{"./util.js":15,"./wb-service":19}],19:[function(require,module,exports){
var util = require('./util.js');
var BluetoothGattCharacteristic = require('./wb-characteristic').BluetoothGattCharacteristic;
function BluetoothGattService(device, gattipService) {
    this._gattIp = device._gattIp;
    this._device = device;
    this._gattIpService = gattipService;
}
module.exports.BluetoothGattService = BluetoothGattService;

BluetoothGattService.prototype = {
    get uuid() {
        return util.toWbUUID(this._service.uuid);
    },
    get isPrimary() {
        // TODO: Implement included services
        return true;
    },
    get device() {
        return this._device;
    },

    getAllCharacteristics: function (characteristicUuids) {
        return util.errorLoggingPromise(function (fulfill, reject) {
            // TODO
            reject("Not implemented");
        });
    },

    getCharacteristic: function (characteristicUuid) {
        var self = this;
        return util.errorLoggingPromise(function (fulfill, reject) {
            var vensiUuid = util.toVensiUUID(self._gattIp.BluetoothUUID.getCharacteristic(characteristicUuid));
            if ('undefined' == typeof vensiUuid) {
                reject("Unable to find characteristic with requested UUID " + characteristicUuid)
            } else {
                // TODO: Implement the object instantiation
                var char = self._gattIpService.characteristics[vensiUuid];
                if (char) {
                    fulfill(new BluetoothGattCharacteristic(self, char));
                } else {
                    var char = self._gattIpService.characteristics[characteristicUuid];
                    if (char) {
                        fulfill(new BluetoothGattCharacteristic(self, char));
                    } else {
                        reject("Characteristic " + characteristicUuid + " not found");
                    }
                }
            }
        });
    },

    getAllIncludedServices: function (serviceUuids) {
        return util.errorLoggingPromise(function (fulfill, reject) {
            // TODO
            reject("Not implemented");
        });
    },

    getIncludedService: function (serviceUuid) {
        return util.errorLoggingPromise(function (fulfill, reject) {
            // TODO
            reject("Not implemented");
        });
    }
};

},{"./util.js":15,"./wb-characteristic":16}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[12]);
