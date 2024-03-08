"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmlTime_1 = __importDefault(require("./SmlTime"));
class SmlListEntry {
    setObjName(v) {
        this._ObjName = v;
    }
    setStatus(v) {
        this._Status = v;
    }
    setStatusType(v) {
        this._StatusType = v;
    }
    setUnit(v) {
        this._Unit = v;
    }
    setScaler(v) {
        this._Scaler = v;
    }
    setValue(v) {
        this._Value = v;
    }
    setValueType(v) {
        this._ValType = v;
    }
    setValueTime(v) {
        this._ValTime = v;
    }
    setValueSig(v) {
        this._ValSig = v;
    }
    toString() {
        let str = "";
        str +=
            "\tObj-Name: " +
                (this._ObjName[0] !== undefined ? this._ObjName[0].toString(10) : "undefined") +
                "-" +
                (this._ObjName[1] !== undefined ? this._ObjName[1].toString(10) : "undefined") +
                ":" +
                (this._ObjName[2] !== undefined ? this._ObjName[2].toString(10) : "undefined") +
                "." +
                (this._ObjName[3] !== undefined ? this._ObjName[3].toString(10) : "undefined") +
                "." +
                (this._ObjName[4] !== undefined ? this._ObjName[4].toString(10) : "undefined") +
                "*" +
                (this._ObjName[5] !== undefined ? this._ObjName[5].toString(10) : "undefined") +
                "\n";
        str += "\tStatus: " + (this._Status ? this._Status.toString(16) : this._Status) + "\n";
        str += "\tVal-Time: " + (this._ValTime ? this._ValTime.toString() : this._ValTime) + "\n";
        str += "\tUnit: " + this._Unit + "\n";
        str += "\tScaler: " + this._Scaler + "\n";
        if ((this._Unit == 255 || this._Unit === undefined) && this._Unit !== undefined) {
            if (this._Value instanceof Buffer)
                str += "\tValue: " + this._Value.toString() + " / " + this._Value.toString("hex") + "\n";
            else
                str += "\tValue: " + this._Value.toString() + " / " + this._Value.toString(16) + "\n";
        }
        else {
            str += "\tValue: " + this._Value + "\n";
        }
        str += "\tValue-Signature: " + (this._ValSig ? this._ValSig.toString("hex") : this._ValSig) + "\n";
        return str;
    }
    // -------------- Getter
    getObjName() {
        return this._ObjName;
    }
    getValue() {
        return this._Value;
    }
    getValueType() {
        return this._ValType;
    }
    getUnit() {
        return this._Unit;
    }
    getScaler() {
        return this._Scaler;
    }
    // -------------- Statics
    static parse(buffer) {
        const smlListEntry = new SmlListEntry();
        const tlField = buffer.readTLField();
        if (tlField.type != 0x07 && tlField.length != 0x07) {
            throw new Error("Unknown TL-Field for SmlListEntry!" + tlField.toString());
        }
        smlListEntry.setObjName(buffer.readOctetString());
        smlListEntry.setStatus(buffer.readUnsigned());
        smlListEntry.setStatusType(buffer.getLastType());
        smlListEntry.setValueTime(SmlTime_1.default.parse(buffer));
        smlListEntry.setUnit(buffer.readUnsigned());
        smlListEntry.setScaler(buffer.readInteger());
        smlListEntry.setValue(buffer.readSmlValue());
        smlListEntry.setValueType(buffer.getLastType());
        smlListEntry.setValueSig(buffer.readOctetString());
        return smlListEntry;
    }
}
module.exports = SmlListEntry;
//# sourceMappingURL=SmlListEntry.js.map