"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const InputType_1 = __importDefault(require("./Packets/Config/InputType"));
const SmaHoConf_1 = __importDefault(require("./SmaHoConf"));
class SmaHoInputConf extends SmaHoConf_1.default {
    constructor() {
        super();
        this.InputType = InputType_1.default.Unconfigured;
        this.OutGroup = -1;
    }
    isMotionDetectonSensor() {
        return (this.InputType == InputType_1.default.MotionDetectionModeButton || this.InputType == InputType_1.default.MotionDetectionSignal);
    }
}
module.exports = SmaHoInputConf;
//# sourceMappingURL=SmaHoInputConf.js.map