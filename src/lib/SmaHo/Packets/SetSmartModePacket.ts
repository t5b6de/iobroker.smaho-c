import SmaHoPacketizer from "../SmaHoPacketizer";
import PacketBase from "./PacketBase";
import PacketType from "./PacketType";

/**
 * Aktiviert SmartMode Only (wenn true im Konstruktur mitgegeben)
 * Deaktiviert die interne Konfiguration.
 * Diese bleibt aber aktiv wenn keine Befehle vom Host kommen (Fallback).
 */
class SetSmartModePacket extends PacketBase {
    private _EnableSmartMode: boolean;

    constructor(enable: boolean) {
        super(PacketType.SetSmartMode, 1, new SmaHoPacketizer()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._EnableSmartMode = enable;
    }

    private genPacketData(): void {
        if (this._Packetizer.isCompleted()) return;

        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(2); // len, cmd only
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._EnableSmartMode ? 1 : 0);
    }
}

export = SetSmartModePacket;
