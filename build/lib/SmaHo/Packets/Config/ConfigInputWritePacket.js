"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigInputWritePacket extends PacketBase_1.default {
    constructor(index, it, og) {
        super(PacketType_1.default.ConfigInputWrite, 4, new SmaHoPacketizer_1.default()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._inType = it;
        this._outGrp = og;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(4); // len, cmd + index + intype + group
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte(this._inType);
        this._Packetizer.addByte(this._outGrp);
    }
}
module.exports = ConfigInputWritePacket;
//# sourceMappingURL=ConfigInputWritePacket.js.map