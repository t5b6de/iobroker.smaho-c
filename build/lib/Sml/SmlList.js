"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmlListEntry_1 = __importDefault(require("./SmlListEntry"));
class SmlList {
    constructor() {
        this._ListEntries = [];
    }
    addListEntry(value) {
        this._ListEntries.push(value);
        //this._ListEntries[this._ListEntries.length] = value;
    }
    getListEntryAt(id) {
        return this._ListEntries[id];
    }
    getLength() {
        return this._ListEntries.length;
    }
    static parse(buffer) {
        const smlList = new SmlList();
        const tlField = buffer.readTLField();
        if (tlField.type != 0x07) {
            throw new Error("Unknown TL-Field for SmlList! " + tlField.type);
        }
        for (let i = 0; i < tlField.length; i++) {
            smlList.addListEntry(SmlListEntry_1.default.parse(buffer));
        }
        // There are some devices that contain a wrong number of records (they send more, so check and try)
        /*while (buffer.buffer.readUInt8(buffer.offset) === 0x77) {
            var currentOffset = buffer.offset;
            try {
                smlList.addListEntry(SmlListEntry.parse(buffer));
            } catch (err) {
                // ok we may have not had an additional ListEntry, so reset Offset and go further normally
                buffer.offset = currentOffset;
                break;
            }
        }
*/
        return smlList;
    }
}
module.exports = SmlList;
//# sourceMappingURL=SmlList.js.map