"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const index_1 = __importDefault(require("smartmeter-obis/index"));
const SmlBuffer_1 = __importDefault(require("../Sml/SmlBuffer"));
const SmlList_1 = __importDefault(require("../Sml/SmlList"));
class SmartMeterInterface {
    reset() {
        this._DataLen = 0;
        this._CurChunk = -1;
        this._CurTransmission = -1;
        this._Buffer = null;
        this._CurPos = 0;
    }
    constructor(storeFunc, logger) {
        this.reset();
        this._StoreCb = storeFunc;
        this._Logger = logger;
    }
    addPacket(dp) {
        if (dp.getChunkIndex() == 0) {
            this._DataLen = dp.getTransmissionSize();
            this._CurChunk = 0;
            if (this._DataLen <= 0) {
                return;
            }
            this._CurTransmission = dp.getTransmissionId();
            this._Buffer = Buffer.alloc(this._DataLen);
        }
        else {
            // Sanity Check:
            if (this._DataLen <= 0 ||
                this._CurTransmission != dp.getTransmissionId() ||
                this._CurChunk != dp.getChunkIndex() - 1) {
                this.reset();
                return;
            }
            if (this._DataLen > 0) {
                const buf = dp.getData();
                //this._Logger.debug(buf.toString("hex"));
                buf.copy(this._Buffer, this._CurPos, 0, dp.getSize());
                this._CurPos += dp.getSize();
                this._CurChunk++;
                if (this._CurPos >= this._DataLen) {
                    this._StoreCb(this.readList(), dp.getMeterIndex());
                    this.reset();
                }
            }
        }
    }
    readList() {
        try {
            const buff = new SmlBuffer_1.default(this._Buffer);
            //this._Logger.debug(this._Buffer.toString("hex"));
            const list = SmlList_1.default.parse(buff);
            const result = {};
            for (let i = 0; i < list.getLength(); i++) {
                const entry = list.getListEntryAt(i);
                try {
                    const obis = new index_1.default.ObisMeasurement(entry.getObjName());
                    let value = entry.getValue();
                    const unit = entry.getUnit();
                    if (typeof value === "number" && entry.getScaler()) {
                        value *= Math.pow(10, entry.getScaler());
                    }
                    obis.addValue(value, unit);
                    result[obis.idToString()] = obis;
                }
                catch (err) {
                    this._Logger.error("Could not parse Value: " + err.toString());
                }
            }
            return result;
        }
        catch (err) {
            this._Logger.error("Could not decode List: " + err.toString());
            this._Logger.error(this._Buffer.toString("hex"));
        }
        return undefined;
    }
}
module.exports = SmartMeterInterface;
//# sourceMappingURL=SmartMeterInterface.js.map