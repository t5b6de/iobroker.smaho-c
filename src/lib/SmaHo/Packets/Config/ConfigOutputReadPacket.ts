import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class ConfigOutputReadPacket extends PacketBase {
    private _RequestIndex: number;

    constructor(index: number) {
        super(PacketType.ConfigOutputRead, 2, new SmaHoPacketizer()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._RequestIndex = index;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(2); // len, cmd + number
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._RequestIndex);
    }
}

export = ConfigOutputReadPacket;
