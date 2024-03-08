"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("./PacketBase"));
class StateResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbStateReceived) {
        super(0xa4, 5, packetizer);
        this._CbStateReceived = cbStateReceived;
        this._Cb = this.cbFun;
        this._ExpanderIndex = -1;
        this._Available = false;
        this._Failed = false;
        this._InStates = 0;
        this._OutStates = 0;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbStateReceived(this);
    }
    parsePacket() {
        this._ExpanderIndex = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const state = this._Packetizer.getByte(2);
        this._Available = (state & 0x01) != 0;
        this._Failed = (state & 0x02) != 0;
        this._InStates = this._Packetizer.getByte(3);
        this._OutStates = this._Packetizer.getByte(4);
        // no further needed.
        return true;
    }
    getPortRange() {
        return this._ExpanderIndex * 8;
    }
    getStates(val) {
        const res = [];
        for (let i = 0; i < 8; i++) {
            res.push((val & (1 << i)) != 0);
        }
        return res;
    }
    getExpanderIndex() {
        return this._ExpanderIndex;
    }
    isFailed() {
        return this._Failed;
    }
    isAvailable() {
        return this._Available;
    }
    getOutStates() {
        return this.getStates(this._OutStates);
    }
    getInStates() {
        return this.getStates(this._InStates);
    }
}
module.exports = StateResponsePacket;
//# sourceMappingURL=StateResponsePacket.js.map