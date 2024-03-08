"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class TriggerInputPacket extends PacketBase_1.default {
    constructor(input, state) {
        super(PacketType_1.default.TriggerInput, 3, new SmaHoPacketizer_1.default());
        this._GenCb = this.genPacketData;
        this._PortId = input;
        this._State = state;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(3); // cmd + out + state
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._PortId);
        this._Packetizer.addByte(this._State ? 1 : 0);
    }
}
module.exports = TriggerInputPacket;
//# sourceMappingURL=TriggerInputPacket.js.map