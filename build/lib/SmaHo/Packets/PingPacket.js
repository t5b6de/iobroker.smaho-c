"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("./PacketBase"));
class PingPacket extends PacketBase_1.default {
    constructor() {
        super(0x01, 1, new SmaHoPacketizer_1.default()); // nr cmd byte
        this._GenCb = this.genPacketData;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(1); // cmd only
        this._Packetizer.addByte(this._Command);
    }
}
module.exports = PingPacket;
//# sourceMappingURL=PingPacket.js.map