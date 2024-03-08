"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const MotionDetectorMode_1 = __importDefault(require("./Packets/MotionDetectorMode"));
const SmaHoConf_1 = __importDefault(require("./SmaHoConf"));
class SmaHoMdsConf extends SmaHoConf_1.default {
    constructor() {
        super();
        this.InitalMode = MotionDetectorMode_1.default.Auto;
        this.LedB = 255;
        this.LedA = 255;
        this.Output = 255;
    }
}
module.exports = SmaHoMdsConf;
//# sourceMappingURL=SmaHoMdsConf.js.map