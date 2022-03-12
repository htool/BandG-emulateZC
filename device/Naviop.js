const debug = require('debug')('device');
debug('Emulate: Naviop AT30 Digital Switching Gateway');

// Device address (suggested)
var deviceAddress = 88;

// AddressClaim PGN
addressClaim = {
  pgn: 60928,
  dst: 255,
  "Unique Number": 1060571,
  "Manufacturer Code": 275,
  "Device Function": 140,
  "Device Class": 30,
  "Device Instance Lower": 0,
  "Device Instance Upper": 0,
  "System Instance": 0,
  "Industry Group": 4
  // "Reserved1": 1,
  // "Reserved2": 2
}

// Product info PGN
productInfo = {
  pgn: 126996,
  dst: 255,
  "NMEA 2000 Version": 2100,
  "Product Code": 4616,
  "Model ID": "AT30 Digital Switching Gateway",
  "Software Version Code": "0.1.00.00",
  "Model Version": "",
  "Model Serial Code": "107835099",
  "Certification Level": 2,
  "Load Equivalency": 1
}

const defaultTransmitPGNs = [
  60928,
  59904,
  59392,
  59904,
  126720,
  127500,
  127501,
  130847 ]

module.exports.defaultTransmitPGNs = defaultTransmitPGNs
