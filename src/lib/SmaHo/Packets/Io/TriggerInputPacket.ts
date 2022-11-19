import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class TriggerInputPacket extends PacketBase {
    private _PortId: number;
    private _State: boolean;

    constructor(input: number, state: boolean) {
        super(PacketType.TriggerInput, 3, new SmaHoPacketizer());
        this._GenCb = this.genPacketData;
        this._PortId = input;
        this._State = state;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(3); // cmd + out + state
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._PortId);
        this._Packetizer.addByte(this._State ? 1 : 0);
    }
}

export = TriggerInputPacket;
