"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const PacketBase_1 = __importDefault(require("./PacketBase"));
const PacketType_1 = __importDefault(require("./PacketType"));
class SmartMeterDataPacket extends PacketBase_1.default {
    constructor(packetizer, cbDataReceived) {
        super(PacketType_1.default.SmlData, 4, packetizer);
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
    async cbFun() {
        this._CbStateReceived(this);
    }
    parsePacket() {
        this._MeterIndex = this._Packetizer.getByte(1);
        this._TransmissionId = this._Packetizer.getByte(2); // 0 = cmd, 1 input, 2 = state, ...
        this._ChunkIndex = this._Packetizer.getByte(3);
        this._ChunkSize = this._Packetizer.getByte(4);
        if (this._ChunkIndex == 0 && this._ChunkSize >= 2) {
            this._TrxLength = (this._Packetizer.getByte(5) << 8) | this._Packetizer.getByte(6);
        }
        else {
            if (this._ChunkIndex > 0 && this._ChunkSize > 1) {
                this._Data = Buffer.alloc(this._ChunkSize);
                const buf = this._Packetizer.getBuffer();
                buf.copy(this._Data, 0, 5, this._ChunkSize + 5);
            }
        }
        // no further needed.
        return true;
    }
    getChunkIndex() {
        return this._ChunkIndex;
    }
    getMeterIndex() {
        return this._MeterIndex;
    }
    getTransmissionSize() {
        return this._TrxLength;
    }
    getTransmissionId() {
        return this._TransmissionId;
    }
    getData() {
        return this._Data;
    }
    getSize() {
        return this._ChunkSize;
    }
}
module.exports = SmartMeterDataPacket;
//# sourceMappingURL=SmartMeterDataPacket.js.map