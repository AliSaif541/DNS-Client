"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DNSQuestion = void 0;
var DNSQuestion = /** @class */ (function () {
    function DNSQuestion(Name, Type) {
        this.Name = Name;
        this.Type = this.getType(Type);
        this.Class = 0x0001;
    }
    DNSQuestion.prototype.getType = function (Type) {
        switch (Type) {
            case "A":
                return 0x0001;
            case "AAAA":
                return 0x001c;
            case "CNAME":
                return 0x0005;
            default:
                throw new Error("Unsupported query type: ".concat(Type));
        }
    };
    DNSQuestion.prototype.toBuffer = function () {
        var labels = this.Name.split('.');
        var parts = labels.map(function (label) {
            var len = Buffer.alloc(1);
            len.writeUInt8(label.length, 0);
            return Buffer.concat([len, Buffer.from(label)]);
        });
        var nullLabel = Buffer.alloc(1, 0);
        var typeBuffer = Buffer.alloc(2);
        typeBuffer.writeUInt16BE(this.Type, 0);
        var classBuffer = Buffer.alloc(2);
        classBuffer.writeUInt16BE(this.Class, 0);
        return Buffer.concat(__spreadArray(__spreadArray([], parts, true), [nullLabel, typeBuffer, classBuffer], false));
    };
    DNSQuestion.ParseQuestion = function (buffer, startPosition) {
        var currentPosition = startPosition;
        var labels = [];
        while (buffer[currentPosition] !== 0) {
            var labelLength = buffer[currentPosition++];
            labels.push(buffer.toString('ascii', currentPosition, currentPosition + labelLength));
            currentPosition += labelLength;
        }
        var name = labels.join('.');
        currentPosition++; // Skip the null byte
        var type = buffer.readUInt16BE(currentPosition);
        currentPosition += 2;
        var rClass = buffer.readUInt16BE(currentPosition);
        currentPosition += 2;
        var question = new DNSQuestion(name, type === 0x0001 ? 'A' : type === 0x001c ? 'AAAA' : 'CNAME');
        question.Class = rClass;
        return { question: question, size: currentPosition - startPosition };
    };
    return DNSQuestion;
}());
exports.DNSQuestion = DNSQuestion;
