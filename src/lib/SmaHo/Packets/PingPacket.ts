import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";

class PingPacket extends PacketBase {
    constructor() {
        super(0x01, 1, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(1); // cmd only
        this._Packetizer.addByte(this._Command);
    }
}

export = PingPacket;
