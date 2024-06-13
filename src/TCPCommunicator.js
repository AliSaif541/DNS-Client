"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpCommunicator = void 0;
var net = require("net");
var TcpCommunicator = /** @class */ (function () {
    function TcpCommunicator() {
        this.DNS_SERVER = '1.1.1.1';
        this.DNS_PORT = 53;
        this.tcpClient = new net.Socket();
        this.tcpClient.connect(this.DNS_PORT, this.DNS_SERVER);
    }
    TcpCommunicator.prototype.send = function (queryBuffer) {
        var lengthBuffer = Buffer.alloc(2);
        lengthBuffer.writeUInt16BE(queryBuffer.length, 0);
        var tcpBuffer = Buffer.concat([lengthBuffer, queryBuffer]);
        this.tcpClient.write(tcpBuffer);
    };
    TcpCommunicator.prototype.onReceive = function (handler) {
        this.tcpClient.on('data', function (data) { return handler(data.subarray(2)); });
    };
    TcpCommunicator.prototype.onError = function (handler) {
        this.tcpClient.on('error', handler);
    };
    TcpCommunicator.prototype.close = function () {
        if (this.tcpClient) {
            this.tcpClient.end();
            this.tcpClient.destroy();
        }
    };
    return TcpCommunicator;
}());
exports.TcpCommunicator = TcpCommunicator;
