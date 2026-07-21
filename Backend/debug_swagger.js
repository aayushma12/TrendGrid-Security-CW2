const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'Test', version: '1.0.0' },
  },
  apis: ['./src/features/**/swagger/*.ts', './src/features/**/route/*.ts'],
};

const spec = swaggerJsdoc(options);
fs.writeFileSync('swagger_debug.json', JSON.stringify(spec, null, 2));
console.log('Paths generated:', Object.keys(spec.paths || {}).length);
