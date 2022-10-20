import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";
import NameType from "./NameType";

class ConfigNameWritePacket extends PacketBase {
    private _NameType: NameType;
    private _NameIndex: number;
    private _NewName: string;

    constructor(nType: NameType, index: number, newName: string) {
        super(PacketType.ConfigNameWrite, 3, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._NameType = nType;
        this._NameIndex = index;
        this._NewName = newName;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        let len = 3;
        let b: Buffer = null;

        if (this._NewName != null && this._NewName != "") {
            b = Buffer.from(this._NewName, "utf8");
            len += b.length;
        }

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(len); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._NameType);
        this._Packetizer.addByte(this._NameIndex);

        if (b != null) {
            this._Packetizer.addBuffer(b);
        }
    }
}

export = ConfigNameWritePacket;
