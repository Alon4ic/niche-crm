import * as dotenv from 'dotenv';
import * as path from 'path';

// Выполняется в каждом тестовом файле до загрузки приложения
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true, quiet: true });
process.env.NODE_ENV = 'test';
