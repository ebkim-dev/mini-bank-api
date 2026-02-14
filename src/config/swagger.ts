import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.4',
    info: {
      title: 'MiniBank API',
      version: '1.0.0',
      description: 'API documentation for MiniBank backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./openapi/**/*.yaml'],
};

export const swaggerSpec = swaggerJSDoc(options);