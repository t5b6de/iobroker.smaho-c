import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";
import NameType from "./NameType";

class ConfigNameResponsePacket extends PacketBase {
    private _Index: number;
    private _NameType: NameType;
    private _NameStr: string;
    private _CbNameReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbNameReceived: CallableFunction) {
        super(PacketType.ConfigNameResponse, 3, packetizer);

        this._CbNameReceived = cbNameReceived;

        this._Cb = this.cbFun;
        this._Index = 0;
        this._NameStr = "";

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbNameReceived(this);
    }

    private parsePacket(): boolean {
        const strLen = this._Packetizer.getPacketLen() - 3; // remove CMD, Type and Index

        if (strLen > 0) {
            this._NameStr = this._Packetizer.getBuffer().toString("utf8", 3, strLen + 3);
        }

        this._NameType = this._Packetizer.getByte(1) as NameType;
        this._Index = this._Packetizer.getByte(2);

        // no further check needed.
        return true;
    }

    public getIndex(): number {
        return this._Index;
    }

    public NameType(): NameType {
        return this._NameType;
    }

    public getName(): string {
        return this._NameStr;
    }
}

export = ConfigNameResponsePacket;
