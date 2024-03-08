"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigNameResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbNameReceived) {
        super(PacketType_1.default.ConfigNameResponse, 3, packetizer);
        this._CbNameReceived = cbNameReceived;
        this._Cb = this.cbFun;
        this._Index = 0;
        this._NameStr = "";
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbNameReceived(this);
    }
    parsePacket() {
        const strLen = this._Packetizer.getPacketLen() - 3; // remove CMD, Type and Index
        if (strLen > 0) {
            this._NameStr = this._Packetizer.getBuffer().toString("utf8", 3, strLen + 3);
        }
        this._NameType = this._Packetizer.getByte(1);
        this._Index = this._Packetizer.getByte(2);
        // no further check needed.
        return true;
    }
    getIndex() {
        return this._Index;
    }
    NameType() {
        return this._NameType;
    }
    getName() {
        return this._NameStr;
    }
}
module.exports = ConfigNameResponsePacket;
//# sourceMappingURL=ConfigNameResponsePacket.js.map