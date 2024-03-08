"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class OutputChangedPacket extends PacketBase_1.default {
    constructor(packetizer, cbOutputChange) {
        super(PacketType_1.default.OutputChange, 3, packetizer);
        this._CbOutputChange = cbOutputChange;
        this._Cb = this.cbFun;
        this._OutputId = -1;
        this._OutputState = false;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbOutputChange(this._OutputId, this._OutputState);
    }
    parsePacket() {
        const outputId = this._Packetizer.getByte(1); // 0 = cmd, 1 output, 2 = state
        const outputState = this._Packetizer.getByte(2);
        if (outputState < 0 || outputState > 1) {
            console.log("SmaHo Packet Error, invalid output state");
            return false;
        }
        this._OutputId = outputId;
        this._OutputState = outputState != 0;
        // no further needed.
        return true;
    }
}
module.exports = OutputChangedPacket;
//# sourceMappingURL=OutputChangedPacket.js.map