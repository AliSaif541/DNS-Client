"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsClient = void 0;
var DNSPacket_1 = require("./DNSPacket");
var StartingPoint_1 = require("./StartingPoint");
var DnsClient = /** @class */ (function () {
    function DnsClient() {
    }
    DnsClient.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // User can initialize their own objects in start through interface
                this.queriesArray = [];
                return [2 /*return*/];
            });
        });
    };
    DnsClient.prototype.queryFlow = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, _i, data_1, _a, name_1, type, state_1;
            return __generator(this, function (_b) {
                try {
                    _loop_1 = function (name_1, type) {
                        if (!name_1 || !type) {
                            console.error("Invalid data received:", { name: name_1, type: type });
                            return { value: void 0 };
                        }
                        if (type !== "AAAA" && type !== "A" && type !== "CNAME") {
                            console.error("".concat(name_1, ", ").concat(type, ": Invalid record type. Please enter 'A', 'AAAA', or 'CNAME'."));
                            return { value: void 0 };
                        }
                        var realName = name_1;
                        if (type === "A" || type === "AAAA") {
                            realName = name_1.replace(/^www\./, '');
                        }
                        var randomNumber = Math.floor(Math.random() * 65536);
                        var index = this_1.queriesArray.length;
                        this_1.queriesArray.push({ index: index, headerID: randomNumber, domainName: realName, type: type, packet: null });
                        var resolvePromise;
                        var promise = new Promise(function (resolve) {
                            resolvePromise = resolve;
                        });
                        StartingPoint_1.pendingQueries.set(randomNumber, { promise: promise, resolve: resolvePromise });
                        var packet = void 0;
                        if (type === "A") {
                            packet = DNSPacket_1.DNSPacket.makeAQuery(randomNumber, name_1);
                        }
                        else if (type === "AAAA") {
                            packet = DNSPacket_1.DNSPacket.makeAAAAQuery(randomNumber, name_1);
                        }
                        else if (type === "CNAME") {
                            packet = DNSPacket_1.DNSPacket.makeCNAMEQuery(randomNumber, name_1);
                        }
                        else {
                            return "continue";
                        }
                        StartingPoint_1.sockets.performDnsQuery(packet.toBuffer());
                    };
                    this_1 = this;
                    for (_i = 0, data_1 = data; _i < data_1.length; _i++) {
                        _a = data_1[_i], name_1 = _a.name, type = _a.type;
                        state_1 = _loop_1(name_1, type);
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                    }
                }
                catch (error) {
                    console.error("Error processing data:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    return DnsClient;
}());
exports.DnsClient = DnsClient;
