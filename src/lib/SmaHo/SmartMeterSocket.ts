import SmartMeterDataPacket from "./Packets/SmartMeterDataPacket";

class SmartMeterSocket {
    private _DataLen: number;
    private _CurChunk: number;
    private _CurTransmission: number;
    private _Buffer: Buffer;
    private _CurPos: number;

    private reset(): void {
        this._DataLen = 0;
        this._CurChunk = -1;
        this._CurTransmission = -1;
        this._Buffer = null;
        this._CurPos = 0;
    }

    constructor() {
        this.reset();
    }

    public addPacket(dp: SmartMeterDataPacket): void {
        if (dp.getChunkIndex() == 0) {
            this._CurTransmission = dp.getTransmissionId();
            this._DataLen = dp.getTransmissionSize();
            this._Buffer = Buffer.alloc(this._DataLen);
        } else {
            // Sanity Check:
            if (this._CurTransmission != dp.getTransmissionId() || this._CurChunk != dp.getChunkIndex() - 1) {
                this.reset();
            }

            if (this._DataLen > 0) {
                const buf: Buffer = dp.getData();
                buf.copy(this._Buffer, this._CurPos, 0, buf.length);
                this._CurPos += buf.length;
            }
        }
    }
}

export = SmartMeterSocket;
