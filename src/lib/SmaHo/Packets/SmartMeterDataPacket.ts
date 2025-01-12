import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";
import PacketType from "./PacketType";

class SmartMeterDataPacket extends PacketBase {
    private _TransmissionId: number;
    private _ChunkIndex: number;
    private _ChunkSize: number;
    private _TrxLength: number;
    private _Data: Buffer;
    private _CbStateReceived: CallableFunction;
    private _MeterIndex: number;

    constructor(packetizer: SmaHoPacketizer, cbDataReceived: CallableFunction) {
        super(PacketType.SmlData, 4, packetizer);

        this._CbStateReceived = cbDataReceived;

        this._Cb = this.cbFun;
        this._TransmissionId = -1;
        this._ChunkIndex = -1;
        this._MeterIndex = -1;
        this._TrxLength = -1;
        this._ChunkSize = 0;
        this._Data = null;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbStateReceived(this);
    }

    private parsePacket(): boolean {
        this._MeterIndex = this._Packetizer.getByte(1);
        this._TransmissionId = this._Packetizer.getByte(2); // 0 = cmd, 1 input, 2 = state, ...
        this._ChunkIndex = this._Packetizer.getByte(3);

        this._ChunkSize = this._Packetizer.getByte(4);

        if (this._ChunkIndex == 0 && this._ChunkSize >= 2) {
            this._TrxLength = (this._Packetizer.getByte(5) << 8) | this._Packetizer.getByte(6);
        } else {
            if (this._ChunkIndex > 0 && this._ChunkSize > 1) {
                this._Data = Buffer.alloc(this._ChunkSize);
                const buf = this._Packetizer.getBuffer();
                buf.copy(this._Data, 0, 5, this._ChunkSize + 5);
            }
        }

        // no further needed.
        return true;
    }

    public getChunkIndex(): number {
        return this._ChunkIndex;
    }

    public getMeterIndex(): number {
        return this._MeterIndex;
    }

    public getTransmissionSize(): number {
        return this._TrxLength;
    }

    public getTransmissionId(): number {
        return this._TransmissionId;
    }

    public getData(): Buffer {
        return this._Data;
    }

    public getSize(): number {
        return this._ChunkSize;
    }
}

export = SmartMeterDataPacket;
