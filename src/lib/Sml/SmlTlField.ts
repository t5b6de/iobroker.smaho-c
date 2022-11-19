class SmlTlField {
    public type: number;
    public length: number;
    constructor(t: number, l: number) {
        this.type = t;
        this.length = l;
    }

    public toString(): string {
        return "t/l: " + this.type + "/" + this.length;
    }
}
export = SmlTlField;
