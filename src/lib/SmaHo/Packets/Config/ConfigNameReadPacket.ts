import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";
import NameType from "./NameType";

class ConfigNameReadPacket extends PacketBase {
    private _RequestType: NameType;
    private _RequestIndex: number;

    constructor(nType: NameType, index: number) {
        super(PacketType.ConfigNameRead, 3, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._RequestType = nType;
        this._RequestIndex = index;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(3); // len, cmd + In/Out + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._RequestType);
        this._Packetizer.addByte(this._RequestIndex);
    }
}

export = ConfigNameReadPacket;
