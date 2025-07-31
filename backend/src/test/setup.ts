// Test setup and configuration
import { config } from '@/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods in tests to reduce noise
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress logs during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
export const testConfig = {
  ...config,
  // Override config for testing
  logging: {
    level: 'error', // Only show errors in tests
  },
};

// Mock data factories
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  fullName: 'Test User',
  createdAt: new Date(),
});

export const createMockWorkspace = () => ({
  id: 'test-workspace-id',
  ownerId: 'test-user-id',
  name: 'Test Workspace',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createMockAnalysis = () => ({
  id: 'test-analysis-id',
  websiteId: 'test-website-id',
  userId: 'test-user-id',
  status: 'completed' as const,
  overallScore: 85,
  accessibilityScore: 80,
  seoScore: 90,
  performanceScore: 85,
  createdAt: new Date(),
  completedAt: new Date(),
});

// Test database utilities
export const setupTestDatabase = async (): Promise<void> => {
  // TODO: Set up test database
};

export const teardownTestDatabase = async (): Promise<void> => {
  // TODO: Clean up test database
};

// Test server utilities
export const createTestServer = async () => {
  // TODO: Create test server instance
};

export default {
  testConfig,
  createMockUser,
  createMockWorkspace,
  createMockAnalysis,
  setupTestDatabase,
  teardownTestDatabase,
  createTestServer,
};