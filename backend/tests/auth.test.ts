import { generateJWT } from '../src/utils/auth';
import { EncryptionService } from '../src/utils/encryption';

describe('Authentication Utils', () => {
  describe('generateJWT', () => {
    test('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const token = generateJWT(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should throw error when JWT_SECRET is missing', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        generateJWT('test-user');
      }).toThrow('JWT_SECRET not configured');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });
});

describe('Encryption Service', () => {
  test('should encrypt and decrypt strings correctly', () => {
    const originalText = 'sensitive data to encrypt';
    const encrypted = EncryptionService.encrypt(originalText);
    const decrypted = EncryptionService.decrypt(encrypted);
    
    expect(encrypted).not.toBe(originalText);
    expect(decrypted).toBe(originalText);
  });

  test('should encrypt and decrypt objects correctly', () => {
    const originalObj = { username: 'test', password: 'secret' };
    const encrypted = EncryptionService.encryptObject(originalObj);
    const decrypted = EncryptionService.decryptObject(encrypted);
    
    expect(encrypted).not.toBe(JSON.stringify(originalObj));
    expect(decrypted).toEqual(originalObj);
  });

  test('should generate secure tokens', () => {
    const token1 = EncryptionService.generateSecureToken();
    const token2 = EncryptionService.generateSecureToken();
    
    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(0);
  });
});