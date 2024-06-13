"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Output = void 0;
var PacketInfo_1 = require("./PacketInfo");
var StartingPoint_1 = require("./StartingPoint");
var Output = /** @class */ (function () {
    function Output(ID) {
        this.ID = ID;
    }
    Output.prototype.findingIPAddress = function () {
        var _this = this;
        var storedValue = StartingPoint_1.queriesArray.find(function (query) { return query.headerID === _this.ID; });
        var packet = storedValue === null || storedValue === void 0 ? void 0 : storedValue.packet;
        if (packet) {
            var addresses = PacketInfo_1.DNSPacket.findIPAddresses(packet);
            return addresses;
        }
        return [];
    };
    Output.prototype.outputAnswer = function (results, queryIndex) {
        var _this = this;
        var storedValue = StartingPoint_1.queriesArray.find(function (query) { return query.headerID === _this.ID; });
        var updatedPacket = storedValue === null || storedValue === void 0 ? void 0 : storedValue.packet;
        if (updatedPacket) {
            console.log("Index ".concat(queryIndex, ": ").concat(updatedPacket.Questions[0].Name, ", ").concat(updatedPacket.Questions[0].Type, ": "));
            if (results.length !== 0) {
                console.log(results);
            }
            else {
                console.log("No IP Adresses found");
            }
            var pendingQuery = StartingPoint_1.pendingQueries.get(this.ID);
            if (pendingQuery) {
                pendingQuery.resolve();
                StartingPoint_1.pendingQueries.delete(this.ID);
            }
        }
    };
    Output.prototype.handleResponse = function (queryIndex) {
        var result = this.findingIPAddress();
        this.outputAnswer(result, queryIndex);
    };
    return Output;
}());
exports.Output = Output;
