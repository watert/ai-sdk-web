// init-dotenv.ts
// This file is responsible for loading environment variables
// It should be imported at the very beginning of the main entry file
import dotenv from 'dotenv';

dotenv.config({
    // quiet: true // 仅在 test 环境 quiet, 见 jest.setup.js
});
