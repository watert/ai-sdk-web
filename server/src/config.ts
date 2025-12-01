import path from 'path';

export const LOCAL_DATA_PATH = path.resolve(__dirname, '../data-local');
export const isProdEnv = process.env.NODE_ENV === 'production';