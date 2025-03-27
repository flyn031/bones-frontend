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
      }]
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.tsx'],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
    },
    globals: {
      'ts-jest': {
        isolatedModules: true
      }
    }
  };