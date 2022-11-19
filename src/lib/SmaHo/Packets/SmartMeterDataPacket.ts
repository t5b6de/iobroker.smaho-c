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

    constructor(packetizer: SmaHoPacketizer, cbDataReceived: CallableFunction) {
        super(PacketType.SmlData, 4, packetizer);

        this._CbStateReceived = cbDataReceived;

        this._Cb = this.cbFun;
        this._TransmissionId = -1;
        this._ChunkIndex = -1;
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
        this._TransmissionId = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state, ...
        this._ChunkIndex = this._Packetizer.getByte(2);

        this._ChunkSize = this._Packetizer.getByte(3);

        if (this._ChunkIndex == 0 && this._ChunkSize >= 2) {
            this._TrxLength = (this._Packetizer.getByte(4) << 8) | this._Packetizer.getByte(5);
        } else {
            if (this._ChunkIndex > 0 && this._ChunkSize > 1) {
                this._Data = Buffer.from(this._Packetizer.getBuffer(), 4, this._ChunkSize);
            }
        }

        // no further needed.
        return true;
    }

    public getChunkIndex(): number {
        return this._ChunkIndex;
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
