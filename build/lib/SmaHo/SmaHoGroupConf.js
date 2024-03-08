"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoConf_1 = __importDefault(require("./SmaHoConf"));
class SmaHoGroupConf extends SmaHoConf_1.default {
    constructor() {
        super();
        this.Outputs = [];
        this.OnTime = 0;
        this.OffTime = 0;
    }
}
module.exports = SmaHoGroupConf;
//# sourceMappingURL=SmaHoGroupConf.js.map