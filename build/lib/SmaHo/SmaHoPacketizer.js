"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketType_1 = __importDefault(require("./Packets/PacketType"));
class SmaHoPacketizer {
    constructor() {
        this.cNoPacket = 0xff;
        this.cSyncByte = 0x5a;
        this.cPacketSize = 250;
        this._Sync = 0;
        this._Completed = false;
        this._PacketLen = 0;
        this._Remain = 0;
        this._Ptr = 0;
        this._Buf = Buffer.alloc(this.cPacketSize); //new Buffer(this.cPacketSize);
    }
    /**
     * Gets CMD-Byte from packet.
     * @returns number
     */
    getPacketType() {
        if (this._Completed)
            return this._Buf[0];
        return PacketType_1.default.Undef;
    }
    getByte(index) {
        return this._Buf[index];
    }
    getPacketLen() {
        return this._PacketLen;
    }
    isCompleted() {
        return this._Completed;
    }
    isEmpty() {
        return !this._Completed && this._Sync == 0 && this._PacketLen == 0;
    }
    sendPacket(p) {
        const buf = Buffer.alloc(2 + this._PacketLen);
        let i;
        buf[0] = this.cSyncByte;
        buf[1] = this._PacketLen;
        for (i = 2; i < buf.length; i++) {
            buf[i] = this._Buf[i - 2];
        }
        p.write(buf);
    }
    sendNetworkPacket(s) {
        const buf = Buffer.alloc(2 + this._PacketLen);
        let i;
        buf[0] = this.cSyncByte;
        buf[1] = this._PacketLen;
        for (i = 2; i < buf.length; i++) {
            buf[i] = this._Buf[i - 2];
        }
        s.write(buf);
    }
    getBuffer() {
        return this._Buf;
    }
    /**
     * adds byte to packet from Stream or other source.
     * @param {number} b
     * @returns
     */
    addByte(b) {
        if (this._Completed)
            return true;
        if (this._Sync !== 0) {
            if (this._Sync == 1) {
                // dann sync Byte bekommtn, dieses ist das längenbyte.
                if (b >= this.cPacketSize) {
                    this._Sync = 0;
                }
                else {
                    this._Sync++;
                    this._PacketLen = b;
                    this._Remain = b;
                }
            }
            else {
                this._Buf[this._Ptr++] = b;
                this._Remain--;
                if (this._Remain == 0) {
                    this._Completed = true;
                    return true;
                }
            }
        }
        else if (b == this.cSyncByte) {
            this._Sync++;
        }
        return false;
    }
    addBuffer(buf) {
        for (let i = 0; i < buf.length; i++) {
            if (this.addByte(buf[i])) {
                return true;
            }
        }
        return false;
    }
}
module.exports = SmaHoPacketizer;
//# sourceMappingURL=SmaHoPacketizer.js.map