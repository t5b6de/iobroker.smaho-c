"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const SmaHoPacketizer_1 = __importDefault(require("../SmaHoPacketizer"));
const PacketBase_1 = __importDefault(require("./PacketBase"));
const PacketType_1 = __importDefault(require("./PacketType"));
/**
 * Aktiviert SmartMode Only (wenn true im Konstruktur mitgegeben)
 * Deaktiviert die interne Konfiguration.
 * Diese bleibt aber aktiv wenn keine Befehle vom Host kommen (Fallback).
 */
class SetSmartModePacket extends PacketBase_1.default {
    constructor(enable) {
        super(PacketType_1.default.SetSmartMode, 1, new SmaHoPacketizer_1.default()); // nr cmd byte
        this._GenCb = this.genPacketData;
        this._EnableSmartMode = enable;
    }
    genPacketData() {
        if (this._Packetizer.isCompleted())
            return;
        this._Packetizer.addByte(this._Packetizer.cSyncByte);
        this._Packetizer.addByte(2); // len, cmd only
        this._Packetizer.addByte(this._Command);
        this._Packetizer.addByte(this._EnableSmartMode ? 1 : 0);
    }
}
module.exports = SetSmartModePacket;
//# sourceMappingURL=SetSmartModePacket.js.map