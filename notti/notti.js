(function() {
  'use strict';

    let encoder = new TextEncoder('utf-8');
    let decoder = new TextDecoder('utf-8');

    var util = new Util();

    const PUBLIC_SERVICE_UUID           = "FFF0";
    const CHARACTERISTIC_RECEIVED_UUID  = "FFF3";
    const CHARACTERISTIC_RENAME_UUID    = "FFF5";
   
  class Notti {
    constructor() {
      this.isOn = '';
      this.lightColour = '';
      this.enable = true;
     
      this.characteristics = new Map();
    }

    connect() {
      let options = {filters:[{name: 'Notti',}]};
      return navigator.bluetooth.requestDevice(options)
      .then(device => {
        this.device = device;
        return device.connectGATT();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(PUBLIC_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, CHARACTERISTIC_RECEIVED_UUID),
              this._cacheCharacteristic(service, CHARACTERISTIC_RENAME_UUID),
            ])
          })
        ]);
      })
    }

    /* Smart Light Services */
   
    toggleNottiLight(status){
        if(status){
            this.turnON();
        }else{
            this.turnOFF();
        }
    };

    turnON(){
        this.enable = false;
        let data = [0x04,0x05,0x00];
        return this._writeCharacteristicValue(CHARACTERISTIC_RECEIVED_UUID, new Uint8Array(data));
    };

    turnOFF(){
      this.enable = true;
        let data = [0x06,0x01,0x00,0x00,0x00];
        return this._writeCharacteristicValue(CHARACTERISTIC_RECEIVED_UUID, new Uint8Array(data));
    };

    RGB(r,g,b){
      let data =  [0x06,0x01,r,g,b];
      return this._writeCharacteristicValue(CHARACTERISTIC_RECEIVED_UUID, new Uint8Array(data));
    }

    customColour(){
        let data = [0x09,0x08,0xFF,0x00,0x00,0x00,0xFF,0x00];
        return this._writeCharacteristicValue(CHARACTERISTIC_RECEIVED_UUID, new Uint8Array(data));
    };






    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this.characteristics.set(characteristicUuid, characteristic);
      });
    }

    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this.characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(value => {
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }

    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this.characteristics.get(characteristicUuid);
      if (this._debug) {
        console.debug('WRITE', characteristic.uuid, value);
      }
      return characteristic.writeValue(value);
    }

    _decodeString(data) {
      return decoder.decode(data);
    }

    _encodeString(data) {
      return encoder.encode(data);
    }

  _lightStatus(data){
      if(data.getUint8(0) == 0){
        return true;
      }else{
        return false;
      }
    }
  }

  window.notti = new Notti();

})();

function Util()
{
    this.canonicalUUID = function(uuidAlias) {
        uuidAlias >>>= 0;  // Make sure the number is positive and 32 bits.
        var strAlias = "0000000" + uuidAlias.toString(16);
        strAlias = strAlias.substr(-8);
        return (strAlias + "-0000-1000-8000-00805f9b34fb").toUpperCase();
    };

    this.stringToDecArray = function(str){
        var dec, i;
        var dec_arr = [];
        if(str){
            for (i=0; i<str.length; i++) {
                dec = str.charCodeAt(i).toString(10);
                dec_arr.push(Number(dec));
            }
        }
        return dec_arr;
    };
    
    return this;
}