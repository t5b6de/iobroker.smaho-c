import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class ConfigOutputWritePacket extends PacketBase {
    private _Outputs: Array<number>;
    private _Index: number;
    private _OffTime: number;
    private _OnTime: number;

    constructor(index: number, outputs: Array<number>, onTime: number, offTime: number) {
        super(PacketType.ConfigOutputWrite, 2 + 4, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._Outputs = outputs;
        this._OnTime = onTime;
        this._OffTime = offTime;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        let len = 2 + 4;
        let b: Buffer = null;

        if (this._Outputs != null && this._Outputs.length > 0) {
            b = Buffer.from(this._Outputs);
            len += this._Outputs.length;
        }

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(len); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte((this._OnTime >> 8) & 0xff);
        this._Packetizer.addByte(this._OnTime & 0xff);
        this._Packetizer.addByte((this._OffTime >> 8) & 0xff);
        this._Packetizer.addByte(this._OffTime & 0xff);

        if (b != null) {
            this._Packetizer.addBuffer(b);
        }
    }
}

export = ConfigOutputWritePacket;
