import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travel Health Ambassador Platform API',
      version,
      description: 'API documentation for the Travel Health Ambassador Platform',
      license: {
        name: 'Private',
      },
      contact: {
        name: 'API Support',
        email: 'support@travelhealthambassador.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            status: {
              type: 'number',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Senior Health Ambassador',
            },
            description: {
              type: 'string',
              example: 'Detailed job description...',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            category: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Pending', 'Active', 'Paused', 'Completed', 'Cancelled', 'Rejected'],
            },
          },
          required: ['title', 'description', 'requirements', 'category'],
        },
        Application: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              format: 'uuid',
            },
            coverLetter: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Shortlisted', 'Interviewing', 'Approved', 'Rejected', 'Withdrawn'],
            },
          },
          required: ['jobId', 'coverLetter'],
        },
        Ambassador: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          required: ['firstName', 'lastName', 'email'],
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

// Swagger documentation for routes
/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 * 
 * /api/applications:
 *   post:
 *     summary: Create a new application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Application'
 *     responses:
 *       201:
 *         description: Application created successfully
 *
 * /api/ambassadors:
 *   get:
 *     summary: Get all ambassadors
 *     tags: [Ambassadors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of ambassadors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ambassador'
 */
