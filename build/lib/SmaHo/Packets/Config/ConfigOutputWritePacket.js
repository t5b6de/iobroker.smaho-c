"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class ConfigOutputWritePacket extends PacketBase_1.default {
    constructor(index, outputs, onTime, offTime) {
        super(PacketType_1.default.ConfigOutputWrite, 2 + 4, new SmaHoPacketizer_1.default()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._Outputs = outputs;
        this._OnTime = onTime;
        this._OffTime = offTime;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        let len = 2 + 4;
        let b = null;
        if (this._Outputs != null && this._Outputs.length > 0) {
            b = Buffer.from(this._Outputs);
            len += this._Outputs.length;
        }
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(len); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte((this._OnTime >> 8) & 0xff);
        this._Packetizer.addByte(this._OnTime & 0xff);
        this._Packetizer.addByte((this._OffTime >> 8) & 0xff);
        this._Packetizer.addByte(this._OffTime & 0xff);
        if (b != null) {
            this._Packetizer.addBuffer(b);
        }
    }
}
module.exports = ConfigOutputWritePacket;
//# sourceMappingURL=ConfigOutputWritePacket.js.map