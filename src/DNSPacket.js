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
var DNSAnswer_1 = require("./DNSAnswer");
var DNSHeader_1 = require("./DNSHeader");
var DNSQuestion_1 = require("./DNSQuestion");
var StartingPoint_1 = require("./StartingPoint");
var DNSPacket = /** @class */ (function () {
    function DNSPacket(headerID) {
        this.Header = new DNSHeader_1.DNSHeader(headerID);
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
        var question = new DNSQuestion_1.DNSQuestion(domain, type);
        this.Questions.push(question);
        this.Header.QDCOUNT++;
    };
    DNSPacket.prototype.toBuffer = function () {
        var questionBuffers = this.Questions.map(function (question) { return question.toBuffer(); });
        return Buffer.concat(__spreadArray([this.Header.toBuffer()], questionBuffers, true));
    };
    DNSPacket.parse = function (response) {
        var header = DNSHeader_1.DNSHeader.decodeHeader(response);
        var entry = StartingPoint_1.Client.queriesArray.find(function (query) { return query.headerID === header.ID; });
        if (!entry) {
            throw new Error("Response Incorrect. Packet could not be identified.");
        }
        var currentPosition = 12;
        var questions = [];
        for (var i = 0; i < header.QDCOUNT; i++) {
            var decodedQuestion = DNSQuestion_1.DNSQuestion.ParseQuestion(response, currentPosition);
            questions.push(decodedQuestion.question);
            currentPosition += decodedQuestion.size;
        }
        var answersDecoded = DNSAnswer_1.DNSAnswer.ParseAnswer(response, header.ANCOUNT, currentPosition);
        var answers = answersDecoded.answers;
        currentPosition = answersDecoded.newPosition;
        var packet = new DNSPacket(header.ID);
        packet.Header = new DNSHeader_1.DNSHeader(header.ID, parseInt(header.flags, DNSPacket.TWO_BYTES));
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
            switch (packet.Answers[i].Type) {
                case this.TYPE_A:
                    addresses.push("".concat(packet.Answers[i].RData[0], ".").concat(packet.Answers[i].RData[1], ".").concat(packet.Answers[i].RData[2], ".").concat(packet.Answers[i].RData[3]));
                    break;
                case this.TYPE_AAAA:
                    var addressString = '';
                    for (var j = 0; j < packet.Answers[i].RData.length; j += 2) {
                        addressString += packet.Answers[i].RData.readUInt16BE(j).toString(16) + ':';
                    }
                    addresses.push(addressString.slice(0, -1));
                    break;
                case this.TYPE_CNAME:
                    var cname = this.decodeCNAME(packet.Answers[i].RData);
                    addresses.push(cname);
                    break;
                default:
                    throw new Error("Unsupported answer type: ".concat(packet.Answers[i].Type));
            }
        }
        return addresses;
    };
    DNSPacket.decodeCNAME = function (rData) {
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
    DNSPacket.TWO_BYTES = 16;
    DNSPacket.TYPE_A = 1;
    DNSPacket.TYPE_AAAA = 28;
    DNSPacket.TYPE_CNAME = 5;
    return DNSPacket;
}());
exports.DNSPacket = DNSPacket;
