"use strict";
var PacketType;
(function (PacketType) {
    PacketType[PacketType["Status"] = 255] = "Status";
    PacketType[PacketType["Ping"] = 1] = "Ping";
    PacketType[PacketType["Output"] = 2] = "Output";
    PacketType[PacketType["OutputChange"] = 162] = "OutputChange";
    PacketType[PacketType["InputChange"] = 3] = "InputChange";
    PacketType[PacketType["StateRequest"] = 4] = "StateRequest";
    PacketType[PacketType["StateResponse"] = 164] = "StateResponse";
    PacketType[PacketType["InfoRequest"] = 5] = "InfoRequest";
    PacketType[PacketType["InfoResponse"] = 165] = "InfoResponse";
    PacketType[PacketType["MotionDetectionModeSet"] = 12] = "MotionDetectionModeSet";
    PacketType[PacketType["MotionDetectionModeChange"] = 172] = "MotionDetectionModeChange";
    PacketType[PacketType["SetSmartMode"] = 11] = "SetSmartMode";
    PacketType[PacketType["TriggerInput"] = 13] = "TriggerInput";
    // Config:
    // Nameings:
    PacketType[PacketType["ConfigNameRead"] = 6] = "ConfigNameRead";
    PacketType[PacketType["ConfigNameResponse"] = 166] = "ConfigNameResponse";
    PacketType[PacketType["ConfigNameWrite"] = 182] = "ConfigNameWrite";
    // Output-Groups:
    PacketType[PacketType["ConfigOutputRead"] = 7] = "ConfigOutputRead";
    PacketType[PacketType["ConfigOutputResponse"] = 167] = "ConfigOutputResponse";
    PacketType[PacketType["ConfigOutputWrite"] = 183] = "ConfigOutputWrite";
    // Input-Types:
    PacketType[PacketType["ConfigInputRead"] = 8] = "ConfigInputRead";
    PacketType[PacketType["ConfigInputResponse"] = 168] = "ConfigInputResponse";
    PacketType[PacketType["ConfigInputWrite"] = 184] = "ConfigInputWrite";
    // Motion Detection Sensors:
    PacketType[PacketType["ConfigMdsRead"] = 9] = "ConfigMdsRead";
    PacketType[PacketType["ConfigMdsResponse"] = 169] = "ConfigMdsResponse";
    PacketType[PacketType["ConfigMdsWrite"] = 185] = "ConfigMdsWrite";
    // EEPROM Direktzugriff:
    PacketType[PacketType["EeDumpRead"] = 10] = "EeDumpRead";
    PacketType[PacketType["EeDumpResponse"] = 170] = "EeDumpResponse";
    PacketType[PacketType["EeDumpWrite"] = 186] = "EeDumpWrite";
    // Smart Meter Daten
    PacketType[PacketType["SmlData"] = 83] = "SmlData";
    PacketType[PacketType["Undef"] = 256] = "Undef";
})(PacketType || (PacketType = {}));
module.exports = PacketType;
//# sourceMappingURL=PacketType.js.map