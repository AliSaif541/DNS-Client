"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Output = void 0;
var DNSPacket_1 = require("./DNSPacket");
var StartingPoint_1 = require("./StartingPoint");
var Output = /** @class */ (function () {
    function Output() {
    }
    Output.prototype.findingIPAddress = function (ID) {
        var storedValue = StartingPoint_1.Client.queriesArray.find(function (query) { return query.headerID === ID; });
        var packet = storedValue === null || storedValue === void 0 ? void 0 : storedValue.packet;
        if (packet) {
            var addresses = DNSPacket_1.DNSPacket.findIPAddresses(packet);
            return addresses;
        }
        return [];
    };
    Output.prototype.outputAnswer = function (results, queryIndex, ID) {
        var storedValue = StartingPoint_1.Client.queriesArray.find(function (query) { return query.headerID === ID; });
        var updatedPacket = storedValue === null || storedValue === void 0 ? void 0 : storedValue.packet;
        if (updatedPacket) {
            console.log("Index ".concat(queryIndex, ": ").concat(updatedPacket.Questions[0].Name, ", ").concat(updatedPacket.Questions[0].Type, ": "));
            if (results.length !== 0) {
                console.log(results);
            }
            else {
                console.log("No IP Adresses found");
            }
            var pendingQuery = StartingPoint_1.pendingQueries.get(ID);
            if (pendingQuery) {
                pendingQuery.resolve();
                StartingPoint_1.pendingQueries.delete(ID);
            }
        }
    };
    Output.prototype.handleResponse = function (queryIndex, ID) {
        var result = this.findingIPAddress(ID);
        this.outputAnswer(result, queryIndex, ID);
    };
    return Output;
}());
exports.Output = Output;
