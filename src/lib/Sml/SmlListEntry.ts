import SmlBuffer from "./SmlBuffer";
import SmlTime from "./SmlTime";

class SmlListEntry {
    private _ObjName: Buffer;
    private _Status: any;
    private _StatusType: number;
    private _Unit: number;
    private _Scaler: number;
    private _Value: any;
    private _ValType: number;
    private _ValTime: SmlTime;
    private _ValSig: Buffer;

    public setObjName(v: Buffer): void {
        this._ObjName = v;
    }

    public setStatus(v: any): void {
        this._Status = v;
    }

    public setStatusType(v: number): void {
        this._StatusType = v;
    }

    public setUnit(v: number): void {
        this._Unit = v;
    }

    public setScaler(v: number): void {
        this._Scaler = v;
    }

    public setValue(v: any): void {
        this._Value = v;
    }

    public setValueType(v: number): void {
        this._ValType = v;
    }

    public setValueTime(v: SmlTime): void {
        this._ValTime = v;
    }

    public setValueSig(v: Buffer): void {
        this._ValSig = v;
    }

    public toString(): string {
        let str = "";
        str +=
            "\tObj-Name: " +
            (this._ObjName[0] !== undefined ? this._ObjName[0].toString(10) : "undefined") +
            "-" +
            (this._ObjName[1] !== undefined ? this._ObjName[1].toString(10) : "undefined") +
            ":" +
            (this._ObjName[2] !== undefined ? this._ObjName[2].toString(10) : "undefined") +
            "." +
            (this._ObjName[3] !== undefined ? this._ObjName[3].toString(10) : "undefined") +
            "." +
            (this._ObjName[4] !== undefined ? this._ObjName[4].toString(10) : "undefined") +
            "*" +
            (this._ObjName[5] !== undefined ? this._ObjName[5].toString(10) : "undefined") +
            "\n";
        str += "\tStatus: " + (this._Status ? this._Status.toString(16) : this._Status) + "\n";
        str += "\tVal-Time: " + (this._ValTime ? this._ValTime.toString() : this._ValTime) + "\n";
        str += "\tUnit: " + this._Unit + "\n";
        str += "\tScaler: " + this._Scaler + "\n";
        if ((this._Unit == 255 || this._Unit === undefined) && this._Unit !== undefined) {
            if (this._Value instanceof Buffer)
                str += "\tValue: " + this._Value.toString() + " / " + this._Value.toString("hex") + "\n";
            else str += "\tValue: " + this._Value.toString() + " / " + this._Value.toString(16) + "\n";
        } else {
            str += "\tValue: " + this._Value + "\n";
        }
        str += "\tValue-Signature: " + (this._ValSig ? this._ValSig.toString("hex") : this._ValSig) + "\n";
        return str;
    }

    // -------------- Getter
    public getObjName(): Buffer {
        return this._ObjName;
    }

    public getValue(): any {
        return this._Value;
    }

    public getValueType(): number {
        return this._ValType;
    }

    public getUnit(): number {
        return this._Unit;
    }

    public getScaler(): number {
        return this._Scaler;
    }

    // -------------- Statics

    public static parse(buffer: SmlBuffer): SmlListEntry {
        const smlListEntry = new SmlListEntry();
        const tlField = buffer.readTLField();

        if (tlField.type != 0x07 && tlField.length != 0x07) {
            throw new Error("Unknown TL-Field for SmlListEntry!");
        }

        smlListEntry.setObjName(buffer.readOctetString());
        smlListEntry.setStatus(buffer.readUnsigned());
        smlListEntry.setStatusType(buffer.getLastType());
        smlListEntry.setValueTime(SmlTime.parse(buffer));
        smlListEntry.setUnit(buffer.readUnsigned());
        smlListEntry.setScaler(buffer.readInteger());
        smlListEntry.setValue(buffer.readSmlValue());
        smlListEntry.setValueType(buffer.getLastType());
        smlListEntry.setValueSig(buffer.readOctetString());

        return smlListEntry;
    }
}

export = SmlListEntry;
