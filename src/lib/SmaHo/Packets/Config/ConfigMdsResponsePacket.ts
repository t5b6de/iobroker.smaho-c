import SmaHoPacketizer from "../../SmaHoPacketizer";
import MotionDetectorMode from "../MotionDetectorMode";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class ConfigMdsResponsePacket extends PacketBase {
    private _Index: number;
    private _InitialMode: MotionDetectorMode;
    private _OutputGroup: number;
    private _LedAOutGroup: number;
    private _LedKOutGroup: number;
    private _CbReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbReceived: CallableFunction) {
        super(PacketType.ConfigMdsResponse, 6, packetizer); // cmd + 5 params

        this._CbReceived = cbReceived;

        this._Cb = this.cbFun;
        this._Index = 0;
        this._OutputGroup = 0;
        this._LedAOutGroup = 0;
        this._LedKOutGroup = 0;
        this._InitialMode = MotionDetectorMode.Unconfigured;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbReceived(this);
    }

    private parsePacket(): boolean {
        this._Index = this._Packetizer.getByte(1);
        this._InitialMode = this._Packetizer.getByte(2);
        this._OutputGroup = this._Packetizer.getByte(3);
        this._LedAOutGroup = this._Packetizer.getByte(4);
        this._LedKOutGroup = this._Packetizer.getByte(5);

        if (this._Index >= 16) {
            return false;
        }

        // ungültige Konfig geradeziehen
        if (!Object.values(MotionDetectorMode).includes(this._InitialMode)) {
            this._InitialMode = MotionDetectorMode.Unconfigured;
        }

        // no further check needed.
        return true;
    }

    public getIndex(): number {
        return this._Index;
    }

    public getInitialMode(): MotionDetectorMode {
        return this._InitialMode;
    }

    public getSignalOut(): number {
        return this._OutputGroup;
    }

    public getLedAOut(): number {
        return this._LedAOutGroup;
    }

    public getLedBOut(): number {
        return this._LedKOutGroup;
    }
}

export = ConfigMdsResponsePacket;
