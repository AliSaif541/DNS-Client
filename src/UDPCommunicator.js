"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UdpCommunicator = void 0;
var dgram = require("dgram");
var UdpCommunicator = /** @class */ (function () {
    function UdpCommunicator() {
        this.DNS_SERVER = '1.1.1.1';
        this.DNS_PORT = 53;
        this.udpSocket = dgram.createSocket('udp4');
    }
    UdpCommunicator.prototype.send = function (queryBuffer) {
        this.udpSocket.send(queryBuffer, 0, queryBuffer.length, this.DNS_PORT, this.DNS_SERVER, function (err) {
            if (err) {
                console.error('Error sending UDP query:', err);
            }
        });
    };
    UdpCommunicator.prototype.onReceive = function (handler) {
        this.udpSocket.on('message', handler);
    };
    UdpCommunicator.prototype.onError = function (handler) {
        this.udpSocket.on('error', handler);
    };
    UdpCommunicator.prototype.close = function () {
        if (this.udpSocket) {
            this.udpSocket.close();
        }
    };
    return UdpCommunicator;
}());
exports.UdpCommunicator = UdpCommunicator;
