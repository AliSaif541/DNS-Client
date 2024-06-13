"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Output = void 0;
var StartingPoint_1 = require("./StartingPoint");
var Output = /** @class */ (function () {
    function Output(ID) {
        this.ID = ID;
    }
    Output.prototype.findingIPAddress = function () {
        var _this = this;
        var storedValue = StartingPoint_1.queriesArray.find(function (query) { return query.headerID === _this.ID; });
        var packet = storedValue === null || storedValue === void 0 ? void 0 : storedValue.packet;
        var addresses = [];
        if (packet) {
            for (var i = 0; i < packet.Answers.length; i++) {
                if (packet.Answers[i].Type === 1) { // A
                    addresses.push("".concat(packet.Answers[i].RData[0], ".").concat(packet.Answers[i].RData[1], ".").concat(packet.Answers[i].RData[2], ".").concat(packet.Answers[i].RData[3]));
                }
                else if (packet.Answers[i].Type === 28) { // AAAA
                    var addressString = '';
                    for (var j = 0; j < packet.Answers[i].RData.length; j += 2) {
                        addressString += packet.Answers[i].RData.readUInt16BE(j).toString(16) + ':';
                    }
                    addresses.push(addressString.slice(0, -1));
                }
                else if (packet.Answers[i].Type === 5) { // CNAME
                    var cname = this.decodeCNAME(packet.Answers[i].RData);
                    addresses.push(cname);
                }
            }
        }
        return addresses;
    };
    Output.prototype.outputAnswer = function (results, updatedPacket, queryIndex, ID) {
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
    };
    Output.prototype.decodeCNAME = function (rData) {
        var cname = '';
        var i = 0;
        while (i < rData.length) {
            var length_1 = rData[i];
            if (length_1 === 0)
                break;
            if (cname.length > 0)
                cname += '.';
            cname += rData.slice(i + 1, i + 1 + length_1).toString('ascii');
            i += length_1 + 1;
        }
        return cname;
    };
    return Output;
}());
exports.Output = Output;
