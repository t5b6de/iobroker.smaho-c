import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";
import InputType from "./InputType";

class ConfigInputWritePacket extends PacketBase {
    private _Index: number;
    private _inType: InputType;
    private _outGrp: number;

    constructor(index: number, it: InputType, og: number) {
        super(PacketType.ConfigInputWrite, 4, new SmaHoPacketizer()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._inType = it;
        this._outGrp = og;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(4); // len, cmd + index + intype + group
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte(this._inType);
        this._Packetizer.addByte(this._outGrp);
    }
}

export = ConfigInputWritePacket;
