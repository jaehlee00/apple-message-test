'use strict';
const { randomUUID } = require('node:crypto');
const { buildComponentURL } = require('../assets/core.private.js');
try {
  console.log(buildComponentURL(process.env, randomUUID(), process.argv[2] || 'bar'));
} catch (error) {
  console.error(error.message); process.exitCode = 1;
}
