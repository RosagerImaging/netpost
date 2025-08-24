"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
class EncryptionService {
    static encrypt(text) {
        return crypto_js_1.default.AES.encrypt(text, ENCRYPTION_KEY).toString();
    }
    static decrypt(encryptedText) {
        const bytes = crypto_js_1.default.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        return bytes.toString(crypto_js_1.default.enc.Utf8);
    }
    static encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }
    static decryptObject(encryptedText) {
        const decryptedString = this.decrypt(encryptedText);
        return JSON.parse(decryptedString);
    }
    static hash(text) {
        return crypto_js_1.default.SHA256(text).toString();
    }
    static generateSecureToken(length = 32) {
        return crypto_js_1.default.lib.WordArray.random(length).toString();
    }
}
exports.EncryptionService = EncryptionService;
