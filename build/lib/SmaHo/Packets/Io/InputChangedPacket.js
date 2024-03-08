"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class InputChangedPacket extends PacketBase_1.default {
    constructor(packetizer, cbInputChange) {
        super(PacketType_1.default.InputChange, 3, packetizer);
        this._CbInputChange = cbInputChange;
        this._Cb = this.cbFun;
        this._InputId = -1;
        this._InputState = false;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbInputChange(this._InputId, this._InputState);
    }
    parsePacket() {
        const inputId = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const inputState = this._Packetizer.getByte(2);
        if (inputState < 0 || inputState > 1) {
            console.log("SmaHo Packet Error, invalid input state");
            return false;
        }
        this._InputId = inputId;
        this._InputState = inputState != 0;
        // no further needed.
        return true;
    }
}
module.exports = InputChangedPacket;
//# sourceMappingURL=InputChangedPacket.js.map