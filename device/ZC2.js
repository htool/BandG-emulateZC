const debug = require('debug')('device');
debug('Emulate: Naviop AT30 Digital Switching Gateway');

// Device address (suggested)
var deviceAddress = 88;

// AddressClaim PGN
addressClaim = {
  pgn: 60928,
  dst: 255,
  "Unique Number": 1678309,
  "Manufacturer Code": 381, // B&G
  "Device Function": 140,
  "Device Class": 40,
  "Device Instance Lower": 0,
  "Device Instance Upper": 0,
  "System Instance": 0,
  "Industry Group": 4,          // Marine
  "Reserved1": 1,
  "Reserved2": 2
}

// Product info PGN
productInfo = {
  pgn: 126996,
  dst: 255,
  "NMEA 2000 Version": 2000,
  "Product Code": 19596,
  "Model ID": "ZC2",
  "Software Version Code": "1.0.01.00",
  "Model Version": "",
  "Model Serial Code": "007141",
  "Certification Level": 2,
  "Load Equivalency": 4
}


const defaultTransmitPGNs = [
  60928,
  59904,
  59392,
  59904,
  126720,
  130847 ]

module.exports.defaultTransmitPGNs = defaultTransmitPGNs
