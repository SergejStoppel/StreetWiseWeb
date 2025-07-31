import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SiteCraft Backend V2 API',
      version: '2.0.0',
      description: 'Multi-tenant accessibility analysis platform API',
      contact: {
        name: 'SiteCraft Support',
        email: 'support@sitecraft.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: config.frontendUrl.replace('3000', '3001'),
        description: 'Local backend server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            message: {
              type: 'string',
              example: 'Human-readable error description',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            requestId: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            ownerId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            websiteId: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
            overallScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            accessibilityScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            seoScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            performanceScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Workspaces',
        description: 'Workspace management',
      },
      {
        name: 'Analyses',
        description: 'Website analysis operations',
      },
      {
        name: 'Reports',
        description: 'Analysis report generation and retrieval',
      },
      {
        name: 'Billing',
        description: 'Subscription and payment management',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/api/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;