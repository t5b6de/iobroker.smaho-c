import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";
import PacketType from "./PacketType";

class InfoResponsePacket extends PacketBase {
    private _HwMajor: number;
    private _HwMinor: number;
    private _SwMajor: number;
    private _SwMinor: number;
    private _InfoString: string;

    private _CbInfoReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbInfoReceived: CallableFunction) {
        super(PacketType.InfoResponse, 4, packetizer);

        this._CbInfoReceived = cbInfoReceived;

        this._Cb = this.cbFun;

        this._HwMajor = -1;
        this._HwMinor = -1;
        this._SwMajor = -1;
        this._SwMinor = -1;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbInfoReceived(this);
    }

    parsePacket(): boolean {
        this._HwMajor = this._Packetizer.getByte(1); // 0 = cmd, 1++ major minor major minor
        this._HwMinor = this._Packetizer.getByte(2); // 0 = cmd, 1++ major minor major minor
        this._SwMajor = this._Packetizer.getByte(3); // 0 = cmd, 1++ major minor major minor
        this._SwMinor = this._Packetizer.getByte(4); // 0 = cmd, 1++ major minor major minor

        this._InfoString =
            "SmaHo C-Board v" + this._HwMajor + "." + this._HwMinor + " SW v" + this._SwMajor + "." + this._SwMinor;

        // no further needed.
        return true;
    }

    public getHwVersion(): string {
        return "v" + this._HwMajor + "." + this._HwMinor;
    }

    public getSwVersion(): string {
        return "v" + this._SwMajor + "." + this._SwMinor;
    }

    public getVersionString(): string {
        return this._InfoString;
    }
}

export = InfoResponsePacket;
