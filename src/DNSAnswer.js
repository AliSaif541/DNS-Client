"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DNSAnswer = void 0;
var DNSAnswer = /** @class */ (function () {
    function DNSAnswer(answerData) {
        var name = answerData.name, type = answerData.type, rClass = answerData.rClass, ttl = answerData.ttl, len = answerData.len, rData = answerData.rData;
        this.Name = name;
        this.Type = type;
        this.Class = rClass;
        this.TTL = ttl;
        this.Len = len;
        this.RData = rData;
    }
    DNSAnswer.addAnswer = function (answerData) {
        return new DNSAnswer(answerData);
    };
    DNSAnswer.ParseAnswer = function (buffer, ANCOUNT, startPosition) {
        var currentPosition = startPosition;
        var answers = [];
        for (var i = 0; i < ANCOUNT; i++) {
            var name_1 = DNSAnswer.decodeName(buffer, currentPosition);
            currentPosition = name_1.size;
            var type = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            var rClass = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            var ttl = buffer.readUInt32BE(currentPosition);
            currentPosition += 4;
            var length_1 = buffer.readUInt16BE(currentPosition);
            currentPosition += 2;
            var rData = buffer.subarray(currentPosition, currentPosition + length_1);
            currentPosition += length_1;
            answers.push(new DNSAnswer({ name: name_1.value, type: type, rClass: rClass, ttl: ttl, len: length_1, rData: rData }));
        }
        return { answers: answers, newPosition: currentPosition };
    };
    DNSAnswer.decodeName = function (buffer, currentPosition) {
        var labels = [];
        var jumped = false;
        var initialPosition = currentPosition;
        var size = 0;
        var orgCurrent = currentPosition;
        while (buffer[currentPosition] !== 0) {
            if ((buffer[currentPosition] & 0xC0) === 0xC0) {
                if (!jumped) {
                    initialPosition += 2;
                }
                jumped = true;
                var offset = buffer.readUInt16BE(currentPosition) & 0x3FFF;
                currentPosition = offset;
            }
            else {
                var labelLength = buffer[currentPosition++];
                labels.push(buffer.toString('ascii', currentPosition, currentPosition + labelLength));
                currentPosition += labelLength;
                if (!jumped) {
                    size += labelLength + 1;
                }
            }
        }
        if (!jumped) {
            size += 1;
        }
        return { size: jumped ? orgCurrent + 2 : size, value: labels.join('.') };
    };
    return DNSAnswer;
}());
exports.DNSAnswer = DNSAnswer;
