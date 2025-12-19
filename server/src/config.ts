import path from 'path';

export const PROJECT_ROOT = __dirname;
export const LOCAL_DATA_PATH = path.resolve(__dirname, '../data-local');
export const USE_LOCAL_MONGO = false;
export const isProdEnv = process.env.NODE_ENV === 'production';