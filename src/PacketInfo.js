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
exports.DNSPacket = void 0;
var StartingPoint_1 = require("./StartingPoint");
var DNSHeader = /** @class */ (function () {
    function DNSHeader(headerID, flags) {
        if (flags === void 0) { flags = 0x0100; }
        this.ID = headerID;
        this.flags = flags;
        this.QDCOUNT = 1;
        this.ANCOUNT = 0;
        this.NSCOUNT = 0;
        this.ARCOUNT = 0;
    }
    DNSHeader.prototype.toBuffer = function () {
        var buffer = Buffer.alloc(12);
        buffer.writeUInt16BE(this.ID, 0);
        buffer.writeUInt16BE(this.flags, 2);
        buffer.writeUInt16BE(this.QDCOUNT, 4);
        buffer.writeUInt16BE(this.ANCOUNT, 6);
        buffer.writeUInt16BE(this.NSCOUNT, 8);
        buffer.writeUInt16BE(this.ARCOUNT, 10);
        return buffer;
    };
    DNSHeader.decodeHeader = function (buffer) {
        var ID = buffer.readUInt16BE(0);
        var flags = buffer.readUInt16BE(2).toString(16);
        var QDCOUNT = buffer.readUInt16BE(4);
        var ANCOUNT = buffer.readUInt16BE(6);
        var NSCOUNT = buffer.readUInt16BE(8);
        var ARCOUNT = buffer.readUInt16BE(10);
        return { ID: ID, flags: flags, QDCOUNT: QDCOUNT, ANCOUNT: ANCOUNT, NSCOUNT: NSCOUNT, ARCOUNT: ARCOUNT };
    };
    return DNSHeader;
}());
var DNSQuestion = /** @class */ (function () {
    function DNSQuestion(Name, Type) {
        this.Name = Name;
        this.Type = this.getType(Type);
        this.Class = 0x0001;
    }
    DNSQuestion.prototype.getType = function (Type) {
        if (Type === "A") {
            return 0x0001;
        }
        else if (Type === "AAAA") {
            return 0x001c;
        }
        else if (Type === "CNAME") {
            return 0x0005;
        }
        else {
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
var DNSAnswer = /** @class */ (function () {
    function DNSAnswer(name, type, rClass, ttl, len, rData) {
        this.Name = name;
        this.Type = type;
        this.Class = rClass;
        this.TTL = ttl;
        this.Len = len;
        this.RData = rData;
    }
    DNSAnswer.addAnswer = function (name, type, rClass, ttl, len, rData) {
        return new DNSAnswer(name, type, rClass, ttl, len, rData);
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
            answers.push(new DNSAnswer(name_1.value, type, rClass, ttl, length_1, rData));
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
var DNSPacket = /** @class */ (function () {
    function DNSPacket(headerID) {
        this.Header = new DNSHeader(headerID);
        this.Questions = [];
        this.Answers = [];
    }
    DNSPacket.makeAQuery = function (headerID, domain) {
        var packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'A');
        return packet;
    };
    DNSPacket.makeAAAAQuery = function (headerID, domain) {
        var packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'AAAA');
        return packet;
    };
    DNSPacket.makeCNAMEQuery = function (headerID, domain) {
        var packet = new DNSPacket(headerID);
        packet.addQuery(domain, 'CNAME');
        return packet;
    };
    DNSPacket.prototype.addQuery = function (domain, type) {
        var question = new DNSQuestion(domain, type);
        this.Questions.push(question);
        this.Header.QDCOUNT++;
    };
    DNSPacket.prototype.toBuffer = function () {
        var questionBuffers = this.Questions.map(function (question) { return question.toBuffer(); });
        return Buffer.concat(__spreadArray([this.Header.toBuffer()], questionBuffers, true));
    };
    DNSPacket.parse = function (response) {
        var header = DNSHeader.decodeHeader(response);
        var entry = StartingPoint_1.queriesArray.find(function (query) { return query.headerID === header.ID; });
        if (!entry) {
            throw new Error("Response Incorrect. Packet could not be identified.");
        }
        var currentPosition = 12;
        var questions = [];
        for (var i = 0; i < header.QDCOUNT; i++) {
            var decodedQuestion = DNSQuestion.ParseQuestion(response, currentPosition);
            questions.push(decodedQuestion.question);
            currentPosition += decodedQuestion.size;
        }
        var answersDecoded = DNSAnswer.ParseAnswer(response, header.ANCOUNT, currentPosition);
        var answers = answersDecoded.answers;
        currentPosition = answersDecoded.newPosition;
        var packet = new DNSPacket(header.ID);
        packet.Header = new DNSHeader(header.ID, parseInt(header.flags, 16));
        packet.Header.QDCOUNT = header.QDCOUNT;
        packet.Header.ANCOUNT = header.ANCOUNT;
        packet.Header.NSCOUNT = header.NSCOUNT;
        packet.Header.ARCOUNT = header.ARCOUNT;
        packet.Questions = questions;
        packet.Answers = answers;
        return packet;
    };
    DNSPacket.findIPAddresses = function (packet) {
        var addresses = [];
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
        return addresses;
    };
    DNSPacket.decodeCNAME = function (rData) {
        var cname = '';
        var i = 0;
        while (i < rData.length) {
            var length_2 = rData[i];
            if (length_2 === 0)
                break;
            if (cname.length > 0)
                cname += '.';
            cname += rData.slice(i + 1, i + 1 + length_2).toString('ascii');
            i += length_2 + 1;
        }
        return cname;
    };
    return DNSPacket;
}());
exports.DNSPacket = DNSPacket;
