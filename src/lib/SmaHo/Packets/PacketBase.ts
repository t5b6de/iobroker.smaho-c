import { Socket } from "net";
import SerialPort from "serialport";
import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketType from "./PacketType";

class PacketBase {
    protected _Command: PacketType;
    protected _Cb: CallableFunction;
    protected _GenCb: CallableFunction;
    private _ReqLen: number;
    protected _Packetizer: SmaHoPacketizer;
    protected _FullyParsed: boolean;
    protected _InitialParsed: boolean;

    constructor(cmdByte: PacketType, requiredLen: number, packetizer: SmaHoPacketizer) {
        this._Command = cmdByte;
        this._Cb = null;
        this._GenCb = null;
        this._ReqLen = requiredLen;
        this._Packetizer = packetizer;
        this._FullyParsed = false; // muss durch Kindklasse implementiert werden.
        this._InitialParsed = this.parsePacketStart();
    }

    /**
     *
     * @returns {boolean} true when ok, otherwise false
     */
    isOkay(): boolean {
        return this._FullyParsed;
    }

    runCallback(): void {
        if (this.isOkay() && this._Cb != null) {
            this._Cb();
        }
    }

    sendPacket(p: SerialPort): void {
        if (this._GenCb != null) {
            this._GenCb();
            this._Packetizer.sendPacket(p);
        }
    }

    sendNetworkPacket(s: Socket): void {
        if (this._GenCb != null) {
            this._GenCb();
            this._Packetizer.sendNetworkPacket(s);
        }
    }

    getPacketType(): PacketType {
        return this._Command;
    }

    parsePacketStart(): boolean {
        if (this._Packetizer.isEmpty()) return false;

        if (!this._Packetizer.isCompleted) {
            console.log("SmaHo Packet Error INCOMPLETE Packet");
            return false;
        }

        const len = this._Packetizer.getPacketLen();

        if (len < 1) {
            console.log("SmaHo Packet Error, not enough data, no cmd.");
            return false;
        }

        if (this._Packetizer.getPacketType() != this._Command) {
            console.log(
                "SmaHo Packet Error, invalid CMD-Byte, got, expected",
                this._Packetizer.getPacketType(),
                this._Command,
            );
            return false;
        }

        if (this._Packetizer.getPacketLen() < this._ReqLen) {
            console.log("SmaHo Packet Error, not enough data.");
            return false;
        }

        return true;
    }

    public dumpPacket(log: ioBroker.Logger): void {
        if (this._GenCb != null) {
            this._GenCb();
        }

        let s = "PacketDump: CMD 0x" + this._Packetizer.getPacketType().toString(16).padStart(2, "0") + "\nData:\n";

        for (let i = 0; i < this._Packetizer.getPacketLen(); i++) {
            if (i != 0) {
                s += " ";
            }

            s += this._Packetizer.getByte(i).toString(16).padStart(2, "0");
        }

        log.info(s);
    }
}

export = PacketBase;
