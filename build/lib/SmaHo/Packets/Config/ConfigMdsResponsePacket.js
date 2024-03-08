"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const MotionDetectorMode_1 = __importDefault(require("../MotionDetectorMode"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigMdsResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbReceived) {
        super(PacketType_1.default.ConfigMdsResponse, 6, packetizer); // cmd + 5 params
        this._CbReceived = cbReceived;
        this._Cb = this.cbFun;
        this._Index = 0;
        this._OutputGroup = 0;
        this._LedAOutGroup = 0;
        this._LedKOutGroup = 0;
        this._InitialMode = MotionDetectorMode_1.default.Unconfigured;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbReceived(this);
    }
    parsePacket() {
        this._Index = this._Packetizer.getByte(1);
        this._InitialMode = this._Packetizer.getByte(2);
        this._OutputGroup = this._Packetizer.getByte(3);
        this._LedAOutGroup = this._Packetizer.getByte(4);
        this._LedKOutGroup = this._Packetizer.getByte(5);
        if (this._Index >= 16) {
            return false;
        }
        // ungültige Konfig geradeziehen
        if (!Object.values(MotionDetectorMode_1.default).includes(this._InitialMode)) {
            this._InitialMode = MotionDetectorMode_1.default.Unconfigured;
        }
        // no further check needed.
        return true;
    }
    getIndex() {
        return this._Index;
    }
    getInitialMode() {
        return this._InitialMode;
    }
    getSignalOut() {
        return this._OutputGroup;
    }
    getLedAOut() {
        return this._LedAOutGroup;
    }
    getLedBOut() {
        return this._LedKOutGroup;
    }
}
module.exports = ConfigMdsResponsePacket;
//# sourceMappingURL=ConfigMdsResponsePacket.js.map