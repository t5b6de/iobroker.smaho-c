"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigMdsWritePacket extends PacketBase_1.default {
    constructor(index, im, out, ledA, ledK) {
        super(PacketType_1.default.ConfigMdsWrite, 2, new SmaHoPacketizer_1.default()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._InitalMode = im;
        this._Out = out;
        this._LedA = ledA;
        this._LedK = ledK;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(6); // len, cmd + index, im, out, leda, ledk
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte(this._InitalMode);
        this._Packetizer.addByte(this._Out);
        this._Packetizer.addByte(this._LedA);
        this._Packetizer.addByte(this._LedK);
    }
}
module.exports = ConfigMdsWritePacket;
//# sourceMappingURL=ConfigMdsWritePacket.js.map