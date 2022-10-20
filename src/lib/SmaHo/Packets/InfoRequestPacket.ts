import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";
import PacketType from "./PacketType";

class InfoRequestPacket extends PacketBase {
    constructor() {
        super(PacketType.InfoRequest, 1, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(1); // len, cmd only
        this._Packetizer.addByte(this._Command);
    }
}

export = InfoRequestPacket;
