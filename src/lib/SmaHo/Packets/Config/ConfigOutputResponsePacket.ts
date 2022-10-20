import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class ConfigOutputResponsePacket extends PacketBase {
    private _Index: number;
    private _Outputs: Array<number>;
    private _OffTime: number;
    private _OnTime: number;
    private _CbReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbReceived: CallableFunction) {
        super(PacketType.ConfigOutputResponse, 2 + 4, packetizer);

        this._CbReceived = cbReceived;

        this._Cb = this.cbFun;
        this._Index = 0;
        this._Outputs = [];

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbReceived(this);
    }

    private parsePacket(): boolean {
        const count = this._Packetizer.getPacketLen() - (2 + 4); // remove cmd + index and timer

        if (count > 10) return false;

        for (let i = 0; i < count; i++) {
            this._Outputs.push(this._Packetizer.getByte(2 + 4 + i));
        }

        this._Index = this._Packetizer.getByte(1);

        this._OnTime = this._Packetizer.getByte(2) << 8;
        this._OnTime |= this._Packetizer.getByte(3);

        this._OffTime = this._Packetizer.getByte(4) << 8;
        this._OffTime |= this._Packetizer.getByte(5);

        // no further check needed.
        return true;
    }

    public getIndex(): number {
        return this._Index;
    }

    public getOutputs(): Array<number> {
        return this._Outputs;
    }

    public getOffTime(): number {
        return this._OffTime;
    }

    public getOnTime(): number {
        return this._OnTime;
    }
}

export = ConfigOutputResponsePacket;
