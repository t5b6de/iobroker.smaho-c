import SmlBuffer from "./SmlBuffer";
import SmlListEntry from "./SmlListEntry";

class SmlList {
    private _ListEntries: Array<SmlListEntry>;

    constructor() {
        this._ListEntries = [];
    }

    public addListEntry(value: SmlListEntry): void {
        this._ListEntries.push(value);
        //this._ListEntries[this._ListEntries.length] = value;
    }

    public getListEntryAt(id: number): SmlListEntry {
        return this._ListEntries[id];
    }

    public getLength(): number {
        return this._ListEntries.length;
    }

    public static parse(buffer: SmlBuffer): SmlList {
        const smlList = new SmlList();
        const tlField = buffer.readTLField();

        if (tlField.type != 0x07) {
            throw new Error("Unknown TL-Field for SmlList!");
        }

        for (let i = 0; i < tlField.length; i++) {
            smlList.addListEntry(SmlListEntry.parse(buffer));
        }
        // There are some devices that contain a wrong number of records (they send more, so check and try)
        /*while (buffer.buffer.readUInt8(buffer.offset) === 0x77) {
            var currentOffset = buffer.offset;
            try {
                smlList.addListEntry(SmlListEntry.parse(buffer));
            } catch (err) {
                // ok we may have not had an additional ListEntry, so reset Offset and go further normally
                buffer.offset = currentOffset;
                break;
            }
        }
*/
        return smlList;
    }
}

export = SmlList;
