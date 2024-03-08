"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigInputReadPacket extends PacketBase_1.default {
    constructor(index) {
        super(PacketType_1.default.ConfigInputRead, 2, new SmaHoPacketizer_1.default()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._RequestIndex = index;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(2); // len, cmd + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._RequestIndex);
    }
}
module.exports = ConfigInputReadPacket;
//# sourceMappingURL=ConfigInputReadPacket.js.map