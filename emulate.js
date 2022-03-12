const debug = require('debug')('emulate')

var myArgs = process.argv.slice(2);
const emulate = myArgs[0] || 'ZC2'
const emulate_init = './device/' + emulate + '.js'

// Load device specific init info
debug('Loading %s', emulate_init)
require(emulate_init)
const defaultTransmitPGNs = require(emulate_init).defaultTransmitPGNs
module.exports.defaultTransmitPGNs = defaultTransmitPGNs

const deviceAddress = myArgs[1];
//  const deviceAddress = require(emulate_init).deviceAddress;
module.exports.deviceAddress = deviceAddress;

debug('deviceAddress: %j', deviceAddress)

require('./canboatjs')
require('./canboatjs/lib/canbus')
const canDevice = require('./canboatjs/lib/canbus').canDevice
// const device = require('./canboatjs/lib/candevice').device
const canbus = new (require('./canboatjs').canbus)({})
const util = require('util')

var part = 0
var displayAssigned = false;

var commission_reply = {
  'ffffff2f04800000ffff': '13,41,9f,fe,ff,ff,03,2f,04,80,02,08,00,00,00,00,00,00,00,00,ff',
  'ffffff2f048001080216bb': '13,41,9f,fe,ff,ff,04,2f,04,80,02,08,02,16,bb,2f,00,82,f0,c0,ff',
  'ffffff2f05800000ffff': '13,41,9f,fe,ff,ff,ff,2f,05,80,02,08,0e,32,33,e8,00,82,f0,c0,ff',
  'ffffff2f06800000ffff': '13,41,9f,fe,ff,ff,ff,2f,06,80,02,08,0e,32,33,e8,00,82,f0,c0,ff',
  'ffffff2f07800000ffff': '13,41,9f,fe,ff,ff,ff,2f,07,80,02,08,0e,32,33,e8,00,82,f0,c0,ff',
  'ffffff2f048001089f1cbb': '13,41,9f,fe,ff,ff,04,2f,04,80,02,08,02,16,bb,2f,00,82,f0,c0,ff'

}

function hex2bin(hex){
    return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
}

switch (emulate) {
  case 'ZC2':
		if (process.stdin.isTTY) {
		  debug('DEBUG enabled. Using keyboard input for state changes.')
			const readline = require('readline');
			readline.emitKeypressEvents(process.stdin);
			process.stdin.setRawMode(true);
			process.stdin.on('keypress', (str, key) => {
			  if (key.ctrl && key.name === 'c') {
			    process.exit();
			  } else if (key.name === 'n') {
			    state_button = 'navigation'
			  } else if (key.name === 'f') {
			    ac12mode = 'followup'
			  } else if (key.name === 'h') {
			    state_button = 'headinghold'
			  } else if (key.name === 'u') {
			    // ac12mode = 'nonfollowup'
			  } else if (key.name === 'w') {
			    // ac12mode = 'wind'
          state_button = 'wind'
			  } else if (key.name === 'd') {
			    state_button= 'nodrift'
			  } else if (key.name === 'u') {
			    key_button = '-10'
			  } else if (key.name === 'i') {
			    key_button = '-1'
			  } else if (key.name === 'o') {
			    key_button = '+1'
			  } else if (key.name === 'p') {
			    key_button = '+10'
			  } else if (key.name === 'e') {
			    // ac12state = 'engaged'
          state_button = 'engage'
			  } else if (key.name === 's') {
			    // ac12state = 'standby'
			    state_button = 'standby'
			  } else if (key.name === 'return') {
			    console.log('')
			  } else if (key.name === '1') {
          part = part + 3
			  } else {
		      debug('Key %s not mapped.\n', key.name)
		    }
			});
		}
  break;
  case 'OP10keypad':
    console.log('OP10 keypad emulator\nButtons: a=auto s=standby m=mode u=-10 i=-1 o=+1 p=+10')
	  const readline = require('readline');
		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);
		process.stdin.on('keypress', (str, key) => {
		  if (key.ctrl && key.name === 'c') {
			  process.exit();
			} else if (key.name === 'a') {
			    button='auto'
			} else if (key.name === 's') {
			    button='standby'
			} else if (key.name === 'm') {
			    button='mode'
			} else if (key.name === 'u') {
			    button='-1'
			} else if (key.name === 'i') {
			    button='+1'
			} else if (key.name === 'o') {
			    button='-10'
			} else if (key.name === 'p') {
			    button='+10'
      } else {
        debug('Key not mapped: %s', key.name);
      }
      if (typeof button != 'undefined') {
        msg = util.format(op10msg, (new Date()).toISOString(), canbus.candevice.address, hexByte(canbus.candevice.address), op10_key_code[button]);
        // debug('Sending pgn: %s', msg);
        canbus.sendPGN(msg)
      }
      delete button
    });
  break;
}


// Variables for multipacket pgns
var pgn130850 = [];
var pilotmode126720 = [];
var pgn129284 = [];
var pgn130845 = [];
var pgn130846 = [];
var pgn130846_size;

const op10_key_code = {
    "+1":      "02,ff,ff,02,0d,00,04",
    "+10":     "02,ff,ff,02,0d,00,05",
    "-1":      "02,ff,ff,02,0d,00,ff",
    "-10":     "02,ff,ff,0a,06,00,00",
    "auto":    "02,ff,ff,0a,09,00,00",
    "mode":    "02,ff,ff,0a,0f,00,00",
    "standby": "02,ff,ff,0a,1c,00,00",
    "-1-10":   "",
    "+1+10":   ""
}

debug('Using device id: %i', canbus.candevice.address)

// Generic functions
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2));
}

function radsToDeg(radians) {
  return radians * 180 / Math.PI
}

function degsToRad(degrees) {
  return degrees * (Math.PI/180.0);
}

function padd(n, p, c)
{
  var pad_char = typeof c !== 'undefined' ? c : '0';
  var pad = new Array(1 + p).join(pad_char);
  return (pad + n).slice(-pad.length);
}

// Sleep
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// Heartbeat PGN 126993
const hexByte = require('./canboatjs/lib/utilities').hexByte
const heartbeat_msg = "%s,7,126993,%s,255,8,60,ea,%s,ff,ff,ff,ff,ff"
var heartbeatSequencenumber = 0

function heartbeat () {
  heartbeatSequencenumber++
  if (heartbeatSequencenumber > 600) {
    heartbeatSequencenumber = 1
  }
  msg = util.format(heartbeat_msg, (new Date()).toISOString(), canbus.candevice.address, hexByte(heartbeatSequencenumber))
  canbus.sendPGN(msg)
}

async function PGN130822 () {
  const messages = [
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0e,00,00,fc,13,25,00,00,74,be",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0f,00,00,fc,13,60,04,00,a3,5c",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,09,00,00,fc,12,1c,00,00,dd,d1",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0a,00,00,fc,13,b6,00,00,94,3a",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0b,00,00,fc,13,b9,00,00,16,67",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0c,00,00,fc,13,6f,00,00,03,bb",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0d,00,00,fc,13,25,00,00,74,be",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0e,00,00,fc,13,25,00,00,74,be" ]
  for (var nr in messages) {
    msg = util.format(messages[nr], (new Date()).toISOString(), canbus.candevice.address)
    canbus.sendPGN(msg)
    await sleep(1000)
  }
}

async function boot130845 () {
  const messages = [
    "%s,3,130845,%s,255,0e,41,9f,fe,ff,ff,ff,2f,4a,00,00,ff,ff,ff,ff",
    "%s,3,130845,%s,255,0e,41,9f,02,ff,ff,ff,2f,4a,00,00,ff,ff,ff,ff",
    "%s,3,130845,%s,255,0e,41,9f,02,ff,ff,ff,2f,12,00,00,ff,ff,ff,ff",
    "%s,3,130845,%s,255,0e,41,9f,02,ff,ff,ff,2f,25,00,00,ff,ff,ff,ff"
  ]
  for (var nr in messages) {
    var msg = util.format(messages[nr], (new Date()).toISOString(), canbus.candevice.address)
    canbus.sendPGN(msg)
    debug('Sending boot packet: %s', msg);
    await sleep(100)
  }
}

function ZC2_displayRequest () {
  if (!displayAssigned) {
    const message = "%s,3,65332,%s,255,8,41,9f,fe,84,0e,32,b3,07"
    var msg = util.format(message, (new Date()).toISOString(), canbus.candevice.address)
    debug('Sending display request packet: %s', msg);
    canbus.sendPGN(msg)
  }
}

function ZC2_PGN130860 () {
  const message = "%s,7,130860,%s,255,21,13,99,ff,ff,ff,ff,7f,ff,ff,ff,7f,ff,ff,ff,ff,ff,ff,ff,7f,ff,ff,ff,7f"
  var msg = util.format(message, (new Date()).toISOString(), canbus.candevice.address)
  canbus.sendPGN(msg)
}

function ZC2_PGN130850 () {
  const message = "%s,2,130850,%s,255,0c,41,9f,ff,ff,64,00,2b,00,ff,ff,ff,ff,ff"
  var msg = util.format(message, (new Date()).toISOString(), canbus.candevice.address)
  canbus.sendPGN(msg)
}


async function OP10_PGN65305 () {
  const messages = [
    "%s,7,65305,%s,255,8,41,9f,01,0b,00,00,00,00",
    "%s,7,65305,%s,255,8,41,9f,01,03,04,00,00,00" ]
  for (var nr in messages) {
    msg = util.format(messages[nr], (new Date()).toISOString(), canbus.candevice.address)
    canbus.sendPGN(msg)
    await sleep(25)
  }
}


switch (emulate) {
  case 'default':
      setTimeout(PGN130822, 5000) // Once at startup
  case 'OP10keypad':
      debug('Emulate: B&G OP10 Keypad')
      setInterval(PGN130822, 300000) // Every 5 minutes
      setInterval(OP10_PGN65305, 1000) // unsure
      setInterval(heartbeat, 60000) // Heart beat PGN
      break;
	case 'ZC2':
	    debug('Emulate: B&G ZC2 remote')
      setInterval(ZC2_displayRequest, 1000)
      // setTimeout(boot130845, 3000)  // Once at startup
      setInterval(heartbeat, 60000) // Heart beat PGN
 	    break;
}

function mainLoop () {
	while (canbus.readableLength > 0) {
	//debug('canbus.readableLength: %i', canbus.readableLength)
    msg = canbus.read()
		// debug('Received packet msg: %j', msg)
	  // debug('msg.pgn.src %i != canbus.candevice.address %i?', msg.pgn.src, canbus.candevice.address)
    if ( msg.pgn.dst == canbus.candevice.address || msg.pgn.dst == 255) {
      msg.pgn.fields = {};
      if (msg.pgn.pgn == 59904) {
        PGN = msg.data[2] * 256 * 256 + msg.data[1] * 256 + msg.data[0];
        debug('ISO request: %j', msg);
        debug('ISO request from %d to %d Data PGN: %i', msg.pgn.src, msg.pgn.dst, PGN);
        msg.pgn.fields.PGN = PGN;
        canbus.candevice.n2kMessage(msg.pgn);
      }
      switch (emulate) {
        case 'op10keypad':
          
          break;
        case 'ZC2':
          if (msg.pgn.pgn == 130846) { // Commission Simnet reply
            pgn130846 = pgn130846.concat(buf2hex(msg.data).slice(1)); // Skip multipart byte
            PGN130846 = pgn130846.join(',');
            if (!PGN130846.match(/^..,41,9f/)) {
              debug('PGN130846 not ok: %s', PGN130846);
              pgn130846 = [];
            } else {
              pgn130846_size = parseInt(pgn130846[0], 16);
            }
            if (pgn130846.length >= pgn130846_size) { // We have required length
              debug('PGN130846 [%d]: %s', msg.pgn.src, PGN130846);
              var PGN130846_key = PGN130846.replace(/,/g,'').substring(8,30);
              var PGN130846_reply = commission_reply[PGN130846_key];
              if (typeof PGN130846_reply != 'undefined') {
                PGN130846_reply = "%s,3,130846,%s,255," + PGN130846_reply;
                PGN130846_reply = util.format(PGN130846_reply, (new Date()).toISOString(), canbus.candevice.address)
                debug('PGN130846 reply: %s', PGN130846_reply)
                canbus.sendPGN(PGN130846_reply)
              } else {
                debug('PGN130846_key missing: %s', PGN130846_key);
              }
              pgn130846 = [];
            }
          }
          
          if (msg.pgn.pgn == 130845) { // Commission Simnet reply
            pgn130845 = pgn130845.concat(buf2hex(msg.data).slice(1)); // Skip multipart byte
            PGN130845 = pgn130845.join(',');
            if (!PGN130845.match(/^0e,41,9f/)) {
              debug('PGN130845 not ok: %s', PGN130845);
              pgn130845 = [];
            }
            if (pgn130845.length > 14) { // We have 3 parts now
              debug('PGN130845 [%d]: %s', msg.pgn.src, PGN130845);
              PGN130845_1 = PGN130845.replace(/,/g,'').substring(0,8);
              PGN130845_key = PGN130845.replace(/,/g,'').substring(8,30);
              debug('PGN130845_key: %s', PGN130845_key);
              PGN130845_reply = PGN130845.substring(0,12);
              if (PGN130845_key == "ffffff2f090000ffffffff") {
                displayAssigned = true;
              }
              // Read or write?
              if (PGN130845.match(/^0e,41,9f,..,ff,ff,ff,..,..,00,00/)) {
                // Read
                PGN130845_value = commission_reply[PGN130845_key];
                if (PGN130845_value === undefined) {
                  debug('130845: missing %s', PGN130845_key);
                } else {
                  debug('130845: Request %s  Reply %s', PGN130845_key, PGN130845_value);
                  PGN130845_reply = PGN130845_reply + PGN130845_value
                }
              } else if (PGN130845.match(/^0e,41,9f,00,ff,ff,ff,..,..,00,0[12]/)) {
                // Write
                PGN130845_reply = PGN130845.substring(12,44)
                PGN130845_key = PGN130845_key.replace(/0001......../, '0000ffffffff');
                PGN130845_reply = PGN130845_reply.replace(/(ff,ff,ff,..,..),(..,..)/, '$1,00,02');
                debug('130845: Write   %s  Reply %s', PGN130845_key, PGN130845_reply);
                commission_reply[PGN130845_key] = PGN130845_reply
                PGN130845_reply = PGN130845;
              } else {
                // Unclear
                debug('PGN130845 unclear type: %s', PGN130845)
                PGN130845_reply = PGN130845.substring(14,500)
              }
              PGN130845_reply = "%s,3,130845,%s,255," + PGN130845_reply;
              PGN130845_reply = util.format(PGN130845_reply, (new Date()).toISOString(), canbus.candevice.address)
              debug('PGN130845 reply: %s', PGN130845_reply)
              canbus.sendPGN(PGN130845_reply)
              pgn130845 = [];
            } 
          }
          break;

        default:
      }
    }
	}
  setTimeout(mainLoop, 50)
}

// Wait for cansend
function waitForSend () {
  if (canbus.candevice.cansend) {
    mainLoop()
    return
  }
  setTimeout (waitForSend, 500)
}

waitForSend()
