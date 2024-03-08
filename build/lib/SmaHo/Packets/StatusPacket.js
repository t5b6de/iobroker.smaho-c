"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("./PacketBase"));
class StatusPacket extends PacketBase_1.default {
    constructor(packetizer, logger) {
        super(0xff, 2, packetizer);
        this.cStOk = 0x00;
        this.cStFailure = 0x46;
        this.cStInvalid = 0x49;
        this.cStInvParam = 0x50;
        this.cStBuffer = 0x4f;
        this.cStMissData = 0x4d;
        this.cStReset = 0x52;
        this.cStEmerRec = 0x45;
        this.cStTestMode = 0x54;
        this.cStatusValues = [];
        this._StatusCallbacks = [];
        this._Log = logger;
        this.cStatusValues[this.cStOk] = "OK";
        this.cStatusValues[this.cStFailure] = "Controller Failure"; // TODO reinit
        this.cStatusValues[this.cStInvalid] = "Invalid command received";
        this.cStatusValues[this.cStInvParam] = "Invalid parameter received";
        this.cStatusValues[this.cStBuffer] = "Controller Buffer Full"; // TODO; Wait and repeat
        this.cStatusValues[this.cStMissData] = "Not enough data received";
        this.cStatusValues[this.cStReset] = "Controller Reset!";
        this.cStatusValues[this.cStEmerRec] = "Recovered from emergency/fallback mode. Synching..."; // TODO request states and Resync MDS
        this.cStatusValues[this.cStTestMode] = "Device in testing mode";
        this._Cb = this.callCallback;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    parsePacket() {
        const sId = this._Packetizer.getByte(1);
        if (!(sId in this.cStatusValues)) {
            this._Log.warn("SmaHo Packet Error, unknown status code: " + sId.toString(16));
            return false;
        }
        this._StatusValue = sId;
        return true;
    }
    async callCallback() {
        const code = this._StatusValue;
        if (code != 0) {
            this._Log.info("Status: " + this.cStatusValues[code]);
        }
        if (code in this._StatusCallbacks && this._StatusCallbacks[code] != null) {
            this._StatusCallbacks[code]();
        }
    }
    setResetCallback(cb) {
        this._StatusCallbacks[this.cStReset] = cb;
    }
    setRecoverCallback(cb) {
        this._StatusCallbacks[this.cStEmerRec] = cb;
    }
}
module.exports = StatusPacket;
//# sourceMappingURL=StatusPacket.js.map