"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("../PacketBase"));
const PacketType_1 = __importDefault(require("../PacketType"));
const InputType_1 = __importDefault(require("./InputType"));
class ConfigInputResponsePacket extends PacketBase_1.default {
    constructor(packetizer, cbReceived) {
        super(PacketType_1.default.ConfigInputResponse, 3, packetizer);
        this._CbReceived = cbReceived;
        this._Cb = this.cbFun;
        this._Index = 0;
        this._InType = InputType_1.default.Unconfigured;
        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }
    async cbFun() {
        this._CbReceived(this);
    }
    parsePacket() {
        this._Index = this._Packetizer.getByte(1);
        this._InType = this._Packetizer.getByte(2);
        this._OutputIndex = this._Packetizer.getByte(3);
        if (!Object.values(InputType_1.default).includes(this._InType)) {
            this._InType = InputType_1.default.Unconfigured;
            this._OutputIndex = 0;
            return false;
        }
        // Motion Detection only 16 possible.
        if ((this._InType == InputType_1.default.MotionDetectionModeButton || this._InType == InputType_1.default.MotionDetectionSignal) &&
            this._OutputIndex > 16) {
            this._OutputIndex = 0;
            this._InType = InputType_1.default.Unconfigured;
            return false;
        }
        // no further check needed.
        return true;
    }
    getIndex() {
        return this._Index;
    }
    getInputType() {
        return this._InType;
    }
    getOutputGroup() {
        return this._OutputIndex;
    }
    isMotionDetectonSensor() {
        return this._InType == InputType_1.default.MotionDetectionModeButton || this._InType == InputType_1.default.MotionDetectionSignal;
    }
}
module.exports = ConfigInputResponsePacket;
//# sourceMappingURL=ConfigInputResponsePacket.js.map