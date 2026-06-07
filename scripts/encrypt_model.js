/**
 * KenZen Sudoku — SLM Model Encryption Script
 * 
 * Encrypts the raw ONNX SLM model weights before bundling into the APK.
 * The model will be decrypted at runtime in memory via the native layer.
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// In production, this key should be injected via CI/CD secrets.
// For demonstration, a placeholder static key is used.
const ENCRYPTION_KEY = crypto.scryptSync('bushido_slm_secret', 'salt', 32);
const ALGORITHM = 'aes-256-cbc';

function encryptModel(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.log(`[WARN] Model file ${inputPath} not found. Skipping encryption.`);
    return;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  const input = fs.readFileSync(inputPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  
  // Prepend IV to the encrypted output for decryption
  const outData = Buffer.concat([iv, encrypted]);
  
  fs.writeFileSync(outputPath, outData);
  console.log(`[SUCCESS] Encrypted model saved to ${outputPath}`);
}

const input = path.join(__dirname, '../assets/slm_q4.ort');
const output = path.join(__dirname, '../android/app/src/main/assets/slm_q4.ort.enc');

// Ensure assets dir exists
const assetsDir = path.dirname(output);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

encryptModel(input, output);
