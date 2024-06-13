"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
var StartingPoint_1 = require("./StartingPoint");
var PacketInfo_1 = require("./PacketInfo");
var OutputLayer_1 = require("./OutputLayer");
var ResponseHandler = /** @class */ (function () {
    function ResponseHandler() {
    }
    ResponseHandler.handleResponse = function (responseBuffer) {
        var updatedPacket = PacketInfo_1.DNSPacket.parse(responseBuffer);
        var ID = updatedPacket.Header.ID;
        var queryIndex = StartingPoint_1.queriesArray.findIndex(function (query) { return query.headerID === ID; });
        if (queryIndex !== -1) {
            var queryInfo = StartingPoint_1.queriesArray[queryIndex];
            if (queryInfo) {
                StartingPoint_1.queriesArray[queryIndex] = __assign(__assign({}, queryInfo), { packet: updatedPacket });
                var output = new OutputLayer_1.Output(ID);
                output.handleResponse(queryIndex);
                // const results = output.findingIPAddress();
                // output.outputAnswer(results, updatedPacket, queryIndex, ID);
            }
            else {
                console.error("Query info for ID ".concat(ID, " is undefined."));
            }
        }
        else {
            console.error("No query found for ID: ".concat(ID));
        }
    };
    return ResponseHandler;
}());
exports.ResponseHandler = ResponseHandler;
