"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const MotionDetectorMode_1 = __importDefault(require("../MotionDetectorMode"));
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
class MotionSensorChangedPacket extends PacketBase_1.default {
    constructor(packetizer, cbInputChange) {
        super(PacketType_1.default.MotionDetectionModeChange, 3, packetizer);
        this._CbMdsChange = cbInputChange;
        this._Cb = this.cbFun;
        this._MdsId = -1;
        this._MdsState = MotionDetectorMode_1.default.Unconfigured;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbMdsChange(this._MdsId, this._MdsState);
    }
    parsePacket() {
        const mdsId = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const mdsState = this._Packetizer.getByte(2);
        if (mdsId >= 16) {
            console.log("SmaHo Packet Error, invalid Motion Detector ID");
            return false;
        }
        // if (Object.values(Vehicle).includes('car')) {
        if (!Object.values(MotionDetectorMode_1.default).includes(mdsState)) {
            console.log("SmaHo Packet Error, invalid Motion Detector Value");
            return false;
        }
        this._MdsId = mdsId;
        this._MdsState = mdsState;
        // no further needed.
        return true;
    }
}
module.exports = MotionSensorChangedPacket;
//# sourceMappingURL=MotionSensorChangedPacket.js.map