"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("./PacketBase"));
const PacketType_1 = __importDefault(require("./PacketType"));
class InfoResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbInfoReceived) {
        super(PacketType_1.default.InfoResponse, 4, packetizer);
        this._CbInfoReceived = cbInfoReceived;
        this._Cb = this.cbFun;
        this._HwMajor = -1;
        this._HwMinor = -1;
        this._SwMajor = -1;
        this._SwMinor = -1;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbInfoReceived(this);
    }
    parsePacket() {
        this._HwMajor = this._Packetizer.getByte(1); // 0 = cmd, 1++ major minor major minor
        this._HwMinor = this._Packetizer.getByte(2); // 0 = cmd, 1++ major minor major minor
        this._SwMajor = this._Packetizer.getByte(3); // 0 = cmd, 1++ major minor major minor
        this._SwMinor = this._Packetizer.getByte(4); // 0 = cmd, 1++ major minor major minor
        this._InfoString =
            "SmaHo C-Board v" + this._HwMajor + "." + this._HwMinor + " SW v" + this._SwMajor + "." + this._SwMinor;
        // no further needed.
        return true;
    }
    getHwVersion() {
        return "v" + this._HwMajor + "." + this._HwMinor;
    }
    getSwVersion() {
        return "v" + this._SwMajor + "." + this._SwMinor;
    }
    getVersionString() {
        return this._InfoString;
    }
}
module.exports = InfoResponsePacket;
//# sourceMappingURL=InfoResponsePacket.js.map