"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigNameWritePacket extends PacketBase_1.default {
    constructor(nType, index, newName) {
        super(PacketType_1.default.ConfigNameWrite, 3, new SmaHoPacketizer_1.default()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._NameType = nType;
        this._NameIndex = index;
        this._NewName = newName;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        let len = 3;
        let b = null;
        if (this._NewName != null && this._NewName != "") {
            b = Buffer.from(this._NewName, "utf8");
            len += b.length;
        }
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(len); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._NameType);
        this._Packetizer.addByte(this._NameIndex);
        if (b != null) {
            this._Packetizer.addBuffer(b);
        }
    }
}
module.exports = ConfigNameWritePacket;
//# sourceMappingURL=ConfigNameWritePacket.js.map