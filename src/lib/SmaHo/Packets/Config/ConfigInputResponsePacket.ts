import SmaHoPacketizer from "../../SmaHoPacketizer";
import PacketBase from "../PacketBase";
import PacketType from "../PacketType";
import InputType from "./InputType";

class ConfigInputResponsePacket extends PacketBase {
    private _Index: number;
    private _InType: InputType;
    private _OutputIndex: number;
    private _CbReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbReceived: CallableFunction) {
        super(PacketType.ConfigInputResponse, 3, packetizer);

        this._CbReceived = cbReceived;

        this._Cb = this.cbFun;
        this._Index = 0;
        this._InType = InputType.Unconfigured;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbReceived(this);
    }

    private parsePacket(): boolean {
        this._Index = this._Packetizer.getByte(1);
        this._InType = this._Packetizer.getByte(2);
        this._OutputIndex = this._Packetizer.getByte(3);

        if (!Object.values(InputType).includes(this._InType)) {
            this._InType = InputType.Unconfigured;
            this._OutputIndex = 0;
            return false;
        }

        // Motion Detection only 16 possible.
        if (
            (this._InType == InputType.MotionDetectionModeButton || this._InType == InputType.MotionDetectionSignal) &&
            this._OutputIndex > 16
        ) {
            this._OutputIndex = 0;
            this._InType = InputType.Unconfigured;
            return false;
        }

        // no further check needed.
        return true;
    }

    public getIndex(): number {
        return this._Index;
    }

    public getInputType(): InputType {
        return this._InType;
    }

    public getOutputGroup(): number {
        return this._OutputIndex;
    }

    public isMotionDetectonSensor(): boolean {
        return this._InType == InputType.MotionDetectionModeButton || this._InType == InputType.MotionDetectionSignal;
    }
}

export = ConfigInputResponsePacket;
