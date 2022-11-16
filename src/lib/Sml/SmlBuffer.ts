import Constants from "./Constants";
import SmlTlField from "./SmlTlField";

class SmlBuffer {
    private _Offset: number;
    private _Buffer: Buffer;
    private _LastValType: number;

    constructor(value: Buffer) {
        this._Buffer = value;
        this._Offset = 0;
    }

    public getLastType(): number {
        return this._LastValType;
    }

    public readTLField(): SmlTlField {
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
        return new SmlTlField(type, length);
    }

    public readOctetString(): Buffer {
        const tlField = this.readTLField();

        const type = tlField.type;
        const length = tlField.length;

        // OPTIONAL
        if (type === 0x00 && length === 0x01) {
            return undefined;
        } else {
            if (type !== 0x08 && type !== 0x00) {
                throw new Error(
                    "Unknown TL-Field 0x" +
                        tlField.type.toString(16) +
                        tlField.length.toString(16) +
                        " for OctetString [Offset: " +
                        this._Offset +
                        "]!",
                );
            } else {
                const result = this._Buffer.slice(this._Offset, this._Offset + tlField.length - 1);
                this._Offset += tlField.length - 1;
                this._LastValType = type;
                return result;
            }
        }
    }

    public readUInt8(): number {
        const result = this._Buffer.readUInt8(this._Offset);
        this._Offset++;
        this._LastValType = Constants.UINT8;
        return result;
    }

    public readInt8(): number {
        const result = this._Buffer.readInt8(this._Offset);
        this._Offset++;
        this._LastValType = Constants.INT8;
        return result;
    }

    public readUInt16(): number {
        const result = this._Buffer.readUInt16BE(this._Offset);
        this._Offset += 2;
        this._LastValType = Constants.UINT16;
        return result;
    }

    public readInt16(): number {
        const result = this._Buffer.readInt16BE(this._Offset);
        this._Offset += 2;
        this._LastValType = Constants.INT16;
        return result;
    }

    public readUInt32(): number {
        const result = this._Buffer.readUInt32BE(this._Offset);
        this._Offset += 4;
        this._LastValType = Constants.UINT32;
        return result;
    }

    public readInt32(): number {
        const result = this._Buffer.readInt32BE(this._Offset);
        this._Offset += 4;
        this._LastValType = Constants.INT32;
        return result;
    }

    public readUInt64(): bigint {
        const result = this._Buffer.readBigUInt64BE(this._Offset);
        this._Offset += 8;
        this._LastValType = Constants.UINT64;
        return result;

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

    public readInt64() {
        const result = this._Buffer.readBigInt64BE(this._Offset);
        this._Offset += 8;
        this._LastValType = Constants.INT64;
        return result;

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

    public readSmlBoolean(): boolean {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;

        if (type === 0x00 && length === 0x01) {
            // OPTIONAL
            return undefined;
        } else {
            if (type != Constants.BOOLEAN || length != 0x02) {
                throw new Error("Wrong TL-Field for Boolean!");
            } else {
                this._LastValType = Constants.BOOLEAN;
                return this.readUInt8() !== 0x00;
            }
        }
    }

    public readSmlValue(): any {
        if (this._Buffer.readUInt8(this._Offset) >> 4 === 0x00 || this._Buffer.readUInt8(this._Offset) >> 4 === 0x08) {
            return this.readOctetString();
        } else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x04) {
            return this.readSmlBoolean();
        } else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x05) {
            return this.readInteger();
        } else if (this._Buffer.readUInt8(this._Offset) >> 4 == 0x06) {
            return this.readUnsigned();
        } else {
            throw new Error("Wrong TL-Field 0x" + this._Buffer.readUInt8(this._Offset).toString(16) + " for SmlValue!");
        }
    }

    public readInteger(): any {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;

        if (type === 0x00 && length === 0x01) {
            return undefined;
        } else {
            if (type != Constants.INTEGER && type !== 0x00) {
                throw new Error("Wrong TL-Field for Integer!");
            } else {
                if (length == 0x02) {
                    this._LastValType = Constants.INT8;
                    return this.readInt8();
                } else if (length == 0x03) {
                    this._LastValType = Constants.INT16;
                    return this.readInt16();
                } else if (length == 0x04) {
                    this._LastValType = Constants.INT32;
                    const result = this._Buffer.readIntBE(this._Offset, 3);
                    this._Offset += 3;
                    return result;
                } else if (length == 0x05) {
                    this._LastValType = Constants.INT32;
                    return this.readInt32();
                } else if (length == 0x06) {
                    this._LastValType = Constants.INT64;
                    const result = this._Buffer.readIntBE(this._Offset, 5);
                    this._Offset += 5;
                    return result;
                } else if (length == 0x09) {
                    this._LastValType = Constants.INT64;
                    return this.readInt64();
                }
            }
        }
    }

    public readUnsigned(): any {
        const tlField = this.readTLField();
        const type = tlField.type;
        const length = tlField.length;

        // Optional
        if (type === 0x00 && length === 0x01) {
            this._LastValType = Constants.OPTIONAL;
            return undefined;
        } else {
            if (type != Constants.UNSIGNED && type !== 0x00) {
                throw new Error("Wrong TL-Field (" + type.toString(16) + ") for Unsigned!");
            } else {
                if (length == 0x02) {
                    this._LastValType = Constants.UINT8;
                    return this.readUInt8();
                } else if (length == 0x03) {
                    this._LastValType = Constants.UINT16;
                    return this.readUInt16();
                } else if (length == 0x04) {
                    // Just for EMH impelementation and short Timestamps because of misconfigured/unreachable NTP Server
                    this._LastValType = Constants.UINT32;
                    const result = this._Buffer.readUIntBE(this._Offset, 3);
                    this._Offset += 3;
                    return result;
                } else if (length == 0x05) {
                    this._LastValType = Constants.UINT32;
                    return this.readUInt32();
                } else if (length == 0x09) {
                    this._LastValType = Constants.UINT64;
                    return this.readUInt64();
                }
            }
        }
    }

    public readChoice(): number {
        const tlField = this.readTLField();

        const type = tlField.type;
        const length = tlField.length;

        if (type === 0x00 && length === 0x01) {
            // OPTIONAL
            return undefined;
        } else if (tlField.type == 0x06 && tlField.length == 0x05) {
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
        } else if (tlField.type != 0x07 && tlField.length != 0x02) {
            throw new Error("Wrong TL-Field 0x" + type.toString(16) + length.toString(16) + " for Choice!");
        } else {
            return this.readUnsigned();
        }
    }

    // public readInt64() {
    //     var Int64 = require("int64-buffer");
    //     var int64 = new Int64.Int64BE(this.buffer, this._Offset);
    //     this._Offset += 8;
    //     this.lastReadValueType = Constants.INT64;
    //     if (int64.toNumber().toString(10) == int64.toString(10)) {
    //         return int64.toNumber();
    //     } else {
    //         return int64.toString(10);
    //     }
    // }
}

export = SmlBuffer;
