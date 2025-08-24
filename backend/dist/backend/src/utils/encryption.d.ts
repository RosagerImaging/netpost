export declare class EncryptionService {
    static encrypt(text: string): string;
    static decrypt(encryptedText: string): string;
    static encryptObject(obj: any): string;
    static decryptObject<T>(encryptedText: string): T;
    static hash(text: string): string;
    static generateSecureToken(length?: number): string;
}
