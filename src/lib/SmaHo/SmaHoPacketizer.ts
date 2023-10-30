import { Socket } from "net";
import SerialPort from "serialport";
import PacketType from "./Packets/PacketType";

class SmaHoPacketizer {
    private cNoPacket = 0xff;
    cSyncByte = 0x5a;
    cPacketSize = 250;

    private _Sync: number;
    private _Completed: boolean;
    private _PacketLen: number;
    private _Remain: number;
    private _Ptr: number;
    private _Buf: Buffer;

    constructor() {
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
    getPacketType(): PacketType {
        if (this._Completed) return this._Buf[0];

        return PacketType.Undef;
    }

    getByte(index: number): number {
        return this._Buf[index];
    }

    getPacketLen(): number {
        return this._PacketLen;
    }

    isCompleted(): boolean {
        return this._Completed;
    }

    isEmpty(): boolean {
        return !this._Completed && this._Sync == 0 && this._PacketLen == 0;
    }

    sendPacket(p: SerialPort): void {
        const buf = Buffer.alloc(2 + this._PacketLen);
        let i: number;

        buf[0] = this.cSyncByte;
        buf[1] = this._PacketLen;

        for (i = 2; i < buf.length; i++) {
            buf[i] = this._Buf[i - 2];
        }

        p.write(buf);
    }

    sendNetworkPacket(s: Socket): void {
        const buf = Buffer.alloc(2 + this._PacketLen);
        let i: number;

        buf[0] = this.cSyncByte;
        buf[1] = this._PacketLen;

        for (i = 2; i < buf.length; i++) {
            buf[i] = this._Buf[i - 2];
        }

        s.write(buf);
    }

    getBuffer(): Buffer {
        return this._Buf;
    }

    /**
     * adds byte to packet from Stream or other source.
     * @param {number} b
     * @returns
     */
    addByte(b: number): boolean {
        if (this._Completed) return true;

        if (this._Sync !== 0) {
            if (this._Sync == 1) {
                // dann sync Byte bekommtn, dieses ist das längenbyte.
                if (b >= this.cPacketSize) {
                    this._Sync = 0;
                } else {
                    this._Sync++;
                    this._PacketLen = b;
                    this._Remain = b;
                }
            } else {
                this._Buf[this._Ptr++] = b;
                this._Remain--;

                if (this._Remain == 0) {
                    this._Completed = true;
                    return true;
                }
            }
        } else if (b == this.cSyncByte) {
            this._Sync++;
        }

        return false;
    }

    addBuffer(buf: Buffer): boolean {
        for (let i = 0; i < buf.length; i++) {
            if (this.addByte(buf[i])) {
                return true;
            }
        }
        return false;
    }
}

export = SmaHoPacketizer;
