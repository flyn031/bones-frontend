module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        target: 'ES2020',
        moduleResolution: 'node',
        types: ['jest', 'node', '@testing-library/jest-dom']
      }
    }],
    // Add this to transform node_modules that use ES modules
    'node_modules/lucide-react/.+\\.(j|t)sx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    // This is important - tell Jest not to ignore these ES module-based packages
    '/node_modules/(?!lucide-react)/'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.tsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    // Add this for any path aliases you're using
    '^@/components/(.*)$': '<rootDir>/src/components/$1'
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};