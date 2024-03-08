"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigOutputResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbReceived) {
        super(PacketType_1.default.ConfigOutputResponse, 2 + 4, packetizer);
        this._CbReceived = cbReceived;
        this._Cb = this.cbFun;
        this._Index = 0;
        this._Outputs = [];
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbReceived(this);
    }
    parsePacket() {
        const count = this._Packetizer.getPacketLen() - (2 + 4); // remove cmd + index and timer
        if (count > 10)
            return false;
        for (let i = 0; i < count; i++) {
            this._Outputs.push(this._Packetizer.getByte(2 + 4 + i));
        }
        this._Index = this._Packetizer.getByte(1);
        this._OnTime = this._Packetizer.getByte(2) << 8;
        this._OnTime |= this._Packetizer.getByte(3);
        this._OffTime = this._Packetizer.getByte(4) << 8;
        this._OffTime |= this._Packetizer.getByte(5);
        // no further check needed.
        return true;
    }
    getIndex() {
        return this._Index;
    }
    getOutputs() {
        return this._Outputs;
    }
    getOffTime() {
        return this._OffTime;
    }
    getOnTime() {
        return this._OnTime;
    }
}
module.exports = ConfigOutputResponsePacket;
//# sourceMappingURL=ConfigOutputResponsePacket.js.map