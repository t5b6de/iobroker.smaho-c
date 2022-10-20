import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";

class InputChangedPacket extends PacketBase {
    private _InputId: number;
    private _InputState: boolean;
    private _CbInputChange: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbInputChange: CallableFunction) {
        super(PacketType.InputChange, 3, packetizer);

        this._CbInputChange = cbInputChange;

        this._Cb = this.cbFun;
        this._InputId = -1;
        this._InputState = false;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbInputChange(this._InputId, this._InputState);
    }

    parsePacket(): boolean {
        const inputId = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const inputState = this._Packetizer.getByte(2);

        if (inputState < 0 || inputState > 1) {
            console.log("SmaHo Packet Error, invalid input state");
            return false;
        }

        this._InputId = inputId;
        this._InputState = inputState != 0;

        // no further needed.
        return true;
    }
}

export = InputChangedPacket;
