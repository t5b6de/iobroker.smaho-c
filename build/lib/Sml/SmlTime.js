"use strict";
class SmlTime {
    toString() {
        let str = "";
        if (this._SecIndex !== undefined) {
            str += "(Sec-Index): " + this._SecIndex + "\n";
        }
        else if (this._Timestamp !== undefined) {
            str += "(Timestamp): " + this._Timestamp + "\n";
        }
        else {
            str += "";
        }
        return str;
    }
    static parse(buffer) {
        const smlTime = new SmlTime();
        const choice = buffer.readChoice();
        if (choice == 0x01) {
            smlTime._SecIndex = buffer.readUnsigned();
        }
        else if (choice == 0x02) {
            smlTime._Timestamp = buffer.readUnsigned();
        }
        return smlTime;
    }
}
module.exports = SmlTime;
//# sourceMappingURL=SmlTime.js.map