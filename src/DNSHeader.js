"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DNSHeader = void 0;
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
exports.DNSHeader = DNSHeader;
