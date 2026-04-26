/**
 * Environment Configuration
 * Centralized environment variables with type safety and validation
 */

interface EnvConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  app: {
    name: string
    version: string
  }
  features: {
    debug: boolean
  }
}

function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  return value ? parseInt(value, 10) : defaultValue
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  return value ? value === 'true' : defaultValue
}

export const env: EnvConfig = {
  api: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3001'),
    timeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 30000),
  },
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Winform Web App'),
    version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  },
  features: {
    debug: getEnvBoolean('NEXT_PUBLIC_ENABLE_DEBUG', false),
  },
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
