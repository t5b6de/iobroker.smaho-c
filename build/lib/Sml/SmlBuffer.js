"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const Constants_1 = __importDefault(require("./Constants"));
const SmlTlField_1 = __importDefault(require("./SmlTlField"));
class SmlBuffer {
    constructor(value) {
        this._Buffer = value;
        this._Offset = 0;
    }
    getLastType() {
        return this._LastValType;
    }
    readTLField() {
        let length = 0;
        let counter = 0;
        let type;
        let readMore = false;
        do {
            const tlField = this._Buffer.readUInt8(this._Offset);
            this._Offset++;
            readMore = tlField >> 7 === 1 ? true : false;
            if (type === undefined) {
                type = (tlField & 0x7f) >> 4;
            }
            length = (length << 4) + (tlField & 0x0f);
            if ((tlField & 0x7f) >> 4 === 0 && readMore) {
                // We have an OctetString and want to return "left length" instead of full length
                counter++;
            }
        } while (readMore);
        length -= counter;
        return new SmlTlField_1.default(type, length);
    }
    readOctetString() {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;
        // OPTIONAL
        if (type === 0x00 && length === 0x01) {
            return undefined;
        }
        else {
            if (type !== 0x08 && type !== 0x00) {
                throw new Error("Unknown TL-Field 0x" +
                    tlField.type.toString(16) +
                    tlField.length.toString(16) +
                    " for OctetString [Offset: " +
                    this._Offset +
                    "]!");
            }
            else {
                const result = this._Buffer.slice(this._Offset, this._Offset + tlField.length - 1);
                this._Offset += tlField.length - 1;
                this._LastValType = type;
                return result;
            }
        }
    }
    readUInt8() {
        const result = this._Buffer.readUInt8(this._Offset);
        this._Offset++;
        this._LastValType = Constants_1.default.UINT8;
        return result;
    }
    readInt8() {
        const result = this._Buffer.readInt8(this._Offset);
        this._Offset++;
        this._LastValType = Constants_1.default.INT8;
        return result;
    }
    readUInt16() {
        const result = this._Buffer.readUInt16BE(this._Offset);
        this._Offset += 2;
        this._LastValType = Constants_1.default.UINT16;
        return result;
    }
    readInt16() {
        const result = this._Buffer.readInt16BE(this._Offset);
        this._Offset += 2;
        this._LastValType = Constants_1.default.INT16;
        return result;
    }
    readUInt32() {
        const result = this._Buffer.readUInt32BE(this._Offset);
        this._Offset += 4;
        this._LastValType = Constants_1.default.UINT32;
        return result;
    }
    readInt32() {
        const result = this._Buffer.readInt32BE(this._Offset);
        this._Offset += 4;
        this._LastValType = Constants_1.default.INT32;
        return result;
    }
    readUInt64() {
        const result = this._Buffer.readBigUInt64BE(this._Offset);
        this._Offset += 8;
        this._LastValType = Constants_1.default.UINT64;
        return Number(result);
        //var result = (this.buffer.readUInt32BE(this._Offset+4)<<8) & this._Buffer.readUIntBE(this._Offset);
        /*var result = this._Buffer.readDoubleBE(this._Offset);
    this._Offset+=8;
    this.lastReadValueType = Constants.UINT64;
    return result;*/
        /*const result = _Buffer.readInt64
        const Int64 = require("int64-buffer");
        var int64 = new Int64.Uint64BE(this.buffer, this._Offset);
        this._Offset += 8;
        if (int64.toNumber().toString(10) == int64.toString(10)) {
            return int64.toNumber();
        } else {
            return int64.toString(10);
       }*/
    }
    readInt64() {
        const result = this._Buffer.readBigInt64BE(this._Offset);
        this._Offset += 8;
        this._LastValType = Constants_1.default.INT64;
        return Number(result);
        //var result = (this.buffer.readUInt32BE(this._Offset+4)<<8) & this._Buffer.readUIntBE(this._Offset);
        /*var result = this._Buffer.readDoubleBE(this._Offset);
    this._Offset+=8;
    this.lastReadValueType = Constants.UINT64;
    return result;*/
        /*const result = _Buffer.readInt64
        const Int64 = require("int64-buffer");
        var int64 = new Int64.Uint64BE(this.buffer, this._Offset);
        this._Offset += 8;
        if (int64.toNumber().toString(10) == int64.toString(10)) {
            return int64.toNumber();
        } else {
            return int64.toString(10);
       }*/
    }
    readSmlBoolean() {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;
        if (type === 0x00 && length === 0x01) {
            // OPTIONAL
            return undefined;
        }
        else {
            if (type != Constants_1.default.BOOLEAN || length != 0x02) {
                throw new Error("Wrong TL-Field for Boolean!");
            }
            else {
                this._LastValType = Constants_1.default.BOOLEAN;
                return this.readUInt8() !== 0x00;
            }
        }
    }
    readSmlValue() {
        if (this._Buffer.readUInt8(this._Offset) >> 4 === 0x00 || this._Buffer.readUInt8(this._Offset) >> 4 === 0x08) {
            return this.readOctetString();
        }
        else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x04) {
            return this.readSmlBoolean();
        }
        else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x05) {
            return this.readInteger();
        }
        else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x06) {
            return this.readUnsigned();
        }
        else {
            throw new Error("Wrong TL-Field 0x" + this._Buffer.readUInt8(this._Offset).toString(16) + " for SmlValue!");
        }
    }
    readInteger() {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;
        if (type === 0x00 && length === 0x01) {
            return undefined;
        }
        else {
            if (type != Constants_1.default.INTEGER && type !== 0x00) {
                throw new Error("Wrong TL-Field for Integer!");
            }
            else {
                if (length == 0x02) {
                    this._LastValType = Constants_1.default.INT8;
                    return this.readInt8();
                }
                else if (length == 0x03) {
                    this._LastValType = Constants_1.default.INT16;
                    return this.readInt16();
                }
                else if (length == 0x04) {
                    this._LastValType = Constants_1.default.INT32;
                    const result = this._Buffer.readIntBE(this._Offset, 3);
                    this._Offset += 3;
                    return result;
                }
                else if (length == 0x05) {
                    this._LastValType = Constants_1.default.INT32;
                    return this.readInt32();
                }
                else if (length == 0x06) {
                    this._LastValType = Constants_1.default.INT64;
                    const result = this._Buffer.readIntBE(this._Offset, 5);
                    this._Offset += 5;
                    return result;
                }
                else if (length == 0x09) {
                    this._LastValType = Constants_1.default.INT64;
                    return this.readInt64();
                }
            }
        }
    }
    readUnsigned() {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;
        // Optional
        if (type === 0x00 && length === 0x01) {
            this._LastValType = Constants_1.default.OPTIONAL;
            return undefined;
        }
        else {
            if (type != Constants_1.default.UNSIGNED && type !== 0x00) {
                throw new Error("Wrong TL-Field (" + type.toString(16) + ") for Unsigned!");
            }
            else {
                if (length == 0x02) {
                    this._LastValType = Constants_1.default.UINT8;
                    return this.readUInt8();
                }
                else if (length == 0x03) {
                    this._LastValType = Constants_1.default.UINT16;
                    return this.readUInt16();
                }
                else if (length == 0x04) {
                    // Just for EMH impelementation and short Timestamps because of misconfigured/unreachable NTP Server
                    this._LastValType = Constants_1.default.UINT32;
                    const result = this._Buffer.readUIntBE(this._Offset, 3);
                    this._Offset += 3;
                    return result;
                }
                else if (length == 0x05) {
                    this._LastValType = Constants_1.default.UINT32;
                    return this.readUInt32();
                }
                else if (length == 0x09) {
                    this._LastValType = Constants_1.default.UINT64;
                    return this.readUInt64();
                }
            }
        }
    }
    readChoice() {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;
        if (type === 0x00 && length === 0x01) {
            // OPTIONAL
            return undefined;
        }
        else if (tlField.type == 0x06 && tlField.length == 0x05) {
            // workaround Holley DTZ541
            // if SML_ListEntry valTime (SML_Time) is given there are missing bytes:
            // 0x72: indicate a list for SML_Time with 2 entries
            // 0x62 0x01: indicate secIndex
            // 0x65 + 4 bytes seconds
            // instead, the DTZ541 starts with the last line: 0x65 + 4 bytes secIndex
            //
            // reset the previously read tl-field to be able
            // to re-read the TLField 0x65 to get the secIndex value
            this._Offset--;
            // this workaround will return choice 0x01 and sets the offset back to
            return 0x01;
        }
        else if (tlField.type != 0x07 && tlField.length != 0x02) {
            throw new Error("Wrong TL-Field 0x" + type.toString(16) + length.toString(16) + " for Choice!");
        }
        else {
            return this.readUnsigned();
        }
    }
}
module.exports = SmlBuffer;
//# sourceMappingURL=SmlBuffer.js.map