import SmlBuffer from "./SmlBuffer";

class SmlTime {
    private _SecIndex: number;
    private _Timestamp: number;

    public toString(): string {
        let str = "";
        if (this._SecIndex !== undefined) {
            str += "(Sec-Index): " + this._SecIndex + "\n";
        } else if (this._Timestamp !== undefined) {
            str += "(Timestamp): " + this._Timestamp + "\n";
        } else {
            str += "";
        }
        return str;
    }

    public static parse(buffer: SmlBuffer): SmlTime {
        const smlTime = new SmlTime();

        const choice = buffer.readChoice();

        if (choice == 0x01) {
            smlTime._SecIndex = buffer.readUnsigned();
        } else if (choice == 0x02) {
            smlTime._Timestamp = buffer.readUnsigned();
        }

        return smlTime;
    }
}

export = SmlTime;
