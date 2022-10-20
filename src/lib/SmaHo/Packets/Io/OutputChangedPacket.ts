import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class OutputChangedPacket extends PacketBase {
    private _OutputId: number;
    private _OutputState: boolean;
    private _CbOutputChange: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbOutputChange: CallableFunction) {
        super(PacketType.OutputChange, 3, packetizer);

        this._CbOutputChange = cbOutputChange;

        this._Cb = this.cbFun;
        this._OutputId = -1;
        this._OutputState = false;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbOutputChange(this._OutputId, this._OutputState);
    }

    parsePacket(): boolean {
        const outputId = this._Packetizer.getByte(1); // 0 = cmd, 1 output, 2 = state
        const outputState = this._Packetizer.getByte(2);

        if (outputState < 0 || outputState > 1) {
            console.log("SmaHo Packet Error, invalid output state");
            return false;
        }

        this._OutputId = outputId;
        this._OutputState = outputState != 0;

        // no further needed.
        return true;
    }
}

export = OutputChangedPacket;
