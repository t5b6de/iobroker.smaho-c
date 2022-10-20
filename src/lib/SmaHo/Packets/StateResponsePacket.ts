import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";

class StateResponsePacket extends PacketBase {
    private _ExpanderIndex: number;
    private _Available: boolean;
    private _Failed: boolean;
    private _InStates: number;
    private _OutStates: number;
    private _CbStateReceived: CallableFunction;

    constructor(packetizer: SmaHoPacketizer, cbStateReceived: CallableFunction) {
        super(0xa4, 5, packetizer);

        this._CbStateReceived = cbStateReceived;

        this._Cb = this.cbFun;
        this._ExpanderIndex = -1;
        this._Available = false;
        this._Failed = false;
        this._InStates = 0;
        this._OutStates = 0;

        if (this._InitialParsed) {
            this._FullyParsed = this.parsePacket();
        }
    }

    private async cbFun(): Promise<void> {
        this._CbStateReceived(this);
    }

    private parsePacket(): boolean {
        this._ExpanderIndex = this._Packetizer.getByte(1); // 0 = cmd, 1 input, 2 = state
        const state = this._Packetizer.getByte(2);

        this._Available = (state & 0x01) != 0;
        this._Failed = (state & 0x02) != 0;

        this._InStates = this._Packetizer.getByte(3);
        this._OutStates = this._Packetizer.getByte(4);

        // no further needed.
        return true;
    }

    public getPortRange(): number {
        return this._ExpanderIndex * 8;
    }

    private getStates(val: number): Array<boolean> {
        const res = [];
        for (let i = 0; i < 8; i++) {
            res.push((val & (1 << i)) != 0);
        }

        return res;
    }

    public getExpanderIndex(): number {
        return this._ExpanderIndex;
    }

    public isFailed(): boolean {
        return this._Failed;
    }

    public isAvailable(): boolean {
        return this._Available;
    }

    public getOutStates(): Array<boolean> {
        return this.getStates(this._OutStates);
    }

    public getInStates(): Array<boolean> {
        return this.getStates(this._InStates);
    }
}

export = StateResponsePacket;
