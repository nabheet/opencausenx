import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
