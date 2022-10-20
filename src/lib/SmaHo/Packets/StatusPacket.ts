import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";

class StatusPacket extends PacketBase {
    private cStOk = 0x00;
    private cStFailure = 0x46;
    private cStInvalid = 0x49;
    private cStInvParam = 0x50;
    private cStBuffer = 0x4f;
    private cStMissData = 0x4d;
    private cStReset = 0x52;
    private cStEmerRec = 0x45;
    private cStTestMode = 0x54;

    private _StatusValue: number;

    private cStatusValues: Array<string> = [];
    private _StatusCallbacks: Array<CallableFunction> = [];

    private _Log: ioBroker.Logger;

    constructor(packetizer: SmaHoPacketizer, logger: ioBroker.Logger) {
        super(0xff, 2, packetizer);
        this._Log = logger;

        this.cStatusValues[this.cStOk] = "OK";
        this.cStatusValues[this.cStFailure] = "Controller Failure"; // TODO reinit
        this.cStatusValues[this.cStInvalid] = "Invalid command received";
        this.cStatusValues[this.cStInvParam] = "Invalid parameter received";
        this.cStatusValues[this.cStBuffer] = "Controller Buffer Full"; // TODO; Wait and repeat
        this.cStatusValues[this.cStMissData] = "Not enough data received";
        this.cStatusValues[this.cStReset] = "Controller Reset!";
        this.cStatusValues[this.cStEmerRec] = "Recovered from emergency/fallback mode. Synching..."; // TODO request states and Resync MDS
        this.cStatusValues[this.cStTestMode] = "Device in testing mode";

        this._Cb = this.callCallback;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private parsePacket(): boolean {
        const sId = this._Packetizer.getByte(1);

        if (!(sId in this.cStatusValues)) {
            this._Log.warn("SmaHo Packet Error, unknown status code: " + sId.toString(16));
            return false;
        }

        this._StatusValue = sId;

        return true;
    }

    private async callCallback(): Promise<void> {
        const code = this._StatusValue;

        if (code != 0) {
            this._Log.info("Status: " + this.cStatusValues[code]);
        }

        if (code in this._StatusCallbacks && this._StatusCallbacks[code] != null) {
            this._StatusCallbacks[code]();
        }
    }

    public setResetCallback(cb: CallableFunction): void {
        this._StatusCallbacks[this.cStReset] = cb;
    }

    public setRecoverCallback(cb: CallableFunction): void {
        this._StatusCallbacks[this.cStEmerRec] = cb;
    }
}

export = StatusPacket;
