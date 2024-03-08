"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigNameReadPacket extends PacketBase_1.default {
    constructor(nType, index) {
        super(PacketType_1.default.ConfigNameRead, 3, new SmaHoPacketizer_1.default()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._RequestType = nType;
        this._RequestIndex = index;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(3); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._RequestType);
        this._Packetizer.addByte(this._RequestIndex);
    }
}
module.exports = ConfigNameReadPacket;
//# sourceMappingURL=ConfigNameReadPacket.js.map