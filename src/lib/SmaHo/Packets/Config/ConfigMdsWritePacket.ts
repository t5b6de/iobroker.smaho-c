import SmaHoPacketizer from "../../SmaHoPacketizer";
import MotionDetectorMode from "../MotionDetectorMode";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class ConfigMdsWritePacket extends PacketBase {
    private _Index: number;
    private _InitalMode: MotionDetectorMode;
    private _Out: number;
    private _LedA: number;
    private _LedK: number;

    constructor(index: number, im: MotionDetectorMode, out: number, ledA: number, ledK: number) {
        super(PacketType.ConfigMdsWrite, 2, new SmaHoPacketizer()); //  cmd, index byte
        this._GenCb = this.genPacketData;
        this._Index = index;
        this._InitalMode = im;
        this._Out = out;
        this._LedA = ledA;
        this._LedK = ledK;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(6); // len, cmd + index, im, out, leda, ledk
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._Index);
        this._Packetizer.addByte(this._InitalMode);
        this._Packetizer.addByte(this._Out);
        this._Packetizer.addByte(this._LedA);
        this._Packetizer.addByte(this._LedK);
    }
}

export = ConfigMdsWritePacket;
