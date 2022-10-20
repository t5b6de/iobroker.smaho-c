import SmaHoPacketizer from "../../SmaHoPacketizer";
import MotionDetectorMode from "../MotionDetectorMode";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class MotionSensorModeSetPacket extends PacketBase {
    private _PortId: number;
    private _State: MotionDetectorMode;

    constructor(output: number, state: MotionDetectorMode) {
        super(PacketType.MotionDetectionModeSet, 3, new SmaHoPacketizer());
        this._GenCb = this.genPacketData;
        this._PortId = output;
        this._State = state;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(3); // cmd + out + state
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._PortId);
        this._Packetizer.addByte(this._State);
    }
}

export = MotionSensorModeSetPacket;
