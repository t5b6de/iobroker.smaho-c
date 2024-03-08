"use strict";
var InputType;
(function (InputType) {
    InputType[InputType["Unconfigured"] = 255] = "Unconfigured";
    // default output groups:
    InputType[InputType["Switch"] = 1] = "Switch";
    InputType[InputType["Button"] = 2] = "Button";
    InputType[InputType["NegativeButton"] = 3] = "NegativeButton";
    InputType[InputType["SwitchOffButton"] = 4] = "SwitchOffButton";
    InputType[InputType["SwitchOnButton"] = 5] = "SwitchOnButton";
    InputType[InputType["SwitchInverted"] = 6] = "SwitchInverted";
    // has MDS as "output group"
    InputType[InputType["MotionDetectionModeButton"] = 8] = "MotionDetectionModeButton";
    InputType[InputType["MotionDetectionSignal"] = 9] = "MotionDetectionSignal";
    // Timergesteuert
    InputType[InputType["BlinkerButton"] = 10] = "BlinkerButton";
    InputType[InputType["BlinkerSwitch"] = 11] = "BlinkerSwitch";
    InputType[InputType["DelayButton"] = 12] = "DelayButton";
})(InputType || (InputType = {}));
module.exports = InputType;
//# sourceMappingURL=InputType.js.map