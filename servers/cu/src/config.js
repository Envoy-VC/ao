import { tmpdir } from 'node:os'

import { z } from 'zod'
import ms from 'ms'

import { domainConfigSchema, positiveIntSchema } from './domain/index.js'

/**
 * Some frameworks will implicitly override NODE_ENV
 *
 * This causes some wackiness with different parts of the same process
 * thinking NODE_ENV is different values.
 *
 * So instead, we use a NODE_CONFIG_ENV environment variable
 * to distinguish which environment config to use. This seems to be a common convention
 * (see https://github.com/node-config/node-config/wiki/Environment-Variables#node_config_env)
 */
const MODE = process.env.NODE_CONFIG_ENV

if (!MODE) throw new Error('NODE_CONFIG_ENV must be defined')

/**
 * The server config is an extension of the config required by the domain (business logic).
 * This prevents our domain from being aware of the environment it is running in ie.
 * An express server. Later, it could be anything
 */
const serverConfigSchema = domainConfigSchema.extend({
  MODE: z.enum(['development', 'production']),
  port: positiveIntSchema,
  DUMP_PATH: z.string().min(1)
})

/**
 * @type {z.infer<typeof serverConfigSchema>}
 *
 * We get some nice Intellisense by defining the type in JSDoc
 * before parsing with the serverConfig schema
 */
const CONFIG_ENVS = {
  development: {
    MODE,
    port: process.env.PORT || 6363,
    GATEWAY_URL: process.env.GATEWAY_URL || 'https://arweave.net',
    UPLOADER_URL: process.env.UPLOADER_URL || 'https://up.arweave.net',
    DB_MODE: process.env.DB_MODE || 'embedded',
    DB_URL: process.env.DB_URL || 'ao-cache',
    DB_MAX_LISTENERS: parseInt(process.env.DB_MAX_LISTENERS || '100'),
    DUMP_PATH: process.env.DUMP_PATH || './static',
    WALLET: process.env.WALLET,
    MEM_MONITOR_INTERVAL: process.env.MEM_MONITOR_INTERVAL || ms('10s'),
    PROCESS_CHECKPOINT_CREATION_THROTTLE: process.env.PROCESS_CHECKPOINT_CREATION_THROTTLE || ms('24h'),
    DISABLE_PROCESS_CHECKPOINT_CREATION: process.env.DISABLE_PROCESS_CHECKPOINT_CREATION !== 'false',
    PROCESS_WASM_MEMORY_MAX_LIMIT: process.env.PROCESS_WASM_MEMORY_MAX_LIMIT || 1_000_000_000, // 1GB
    PROCESS_WASM_COMPUTE_MAX_LIMIT: process.env.PROCESS_WASM_COMPUTE_MAX_LIMIT || 9_000_000_000, // 9b
    WASM_EVALUATION_MAX_WORKERS: process.env.WASM_EVALUATION_MAX_WORKERS || 3,
    WASM_INSTANCE_CACHE_MAX_SIZE: process.env.WASM_INSTANCE_CACHE_MAX_SIZE || 5, // 5 loaded wasm modules
    WASM_MODULE_CACHE_MAX_SIZE: process.env.WASM_MODULE_CACHE_MAX_SIZE || 5, // 5 wasm binaries
    WASM_BINARY_FILE_DIRECTORY: process.env.WASM_BINARY_FILE_DIRECTORY || tmpdir(),
    PROCESS_MEMORY_CACHE_MAX_SIZE: process.env.PROCESS_MEMORY_CACHE_MAX_SIZE || 500_000_000, // 500MB
    PROCESS_MEMORY_CACHE_TTL: process.env.PROCESS_MEMORY_CACHE_TTL || ms('24h'),
    BUSY_THRESHOLD: process.env.BUSY_THRESHOLD || ms('15s')
  },
  production: {
    MODE,
    port: process.env.PORT || 6363,
    GATEWAY_URL: process.env.GATEWAY_URL || 'https://arweave.net',
    UPLOADER_URL: process.env.UPLOADER_URL || 'https://up.arweave.net',
    DB_MODE: process.env.DB_MODE || 'embedded',
    DB_URL: process.env.DB_URL || 'ao-cache',
    DB_MAX_LISTENERS: parseInt(process.env.DB_MAX_LISTENERS || '100'),
    DUMP_PATH: process.env.DUMP_PATH || tmpdir(),
    WALLET: process.env.WALLET,
    MEM_MONITOR_INTERVAL: process.env.MEM_MONITOR_INTERVAL || ms('30s'),
    PROCESS_CHECKPOINT_CREATION_THROTTLE: process.env.PROCESS_CHECKPOINT_CREATION_THROTTLE || ms('24h'),
    DISABLE_PROCESS_CHECKPOINT_CREATION: process.env.DISABLE_PROCESS_CHECKPOINT_CREATION !== 'false', // TODO: disabled by default for now. Enable by default later
    PROCESS_WASM_MEMORY_MAX_LIMIT: process.env.PROCESS_WASM_MEMORY_MAX_LIMIT || 1_000_000_000, // 1GB
    PROCESS_WASM_COMPUTE_MAX_LIMIT: process.env.PROCESS_WASM_COMPUTE_MAX_LIMIT || 9_000_000_000, // 9b
    WASM_EVALUATION_MAX_WORKERS: process.env.WASM_EVALUATION_MAX_WORKERS || 3,
    WASM_INSTANCE_CACHE_MAX_SIZE: process.env.WASM_INSTANCE_CACHE_MAX_SIZE || 5, // 5 loaded wasm modules
    WASM_MODULE_CACHE_MAX_SIZE: process.env.WASM_MODULE_CACHE_MAX_SIZE || 5, // 5 wasm binaries
    WASM_BINARY_FILE_DIRECTORY: process.env.WASM_BINARY_FILE_DIRECTORY || tmpdir(),
    PROCESS_MEMORY_CACHE_MAX_SIZE: process.env.PROCESS_MEMORY_CACHE_MAX_SIZE || 500_000_000, // 500MB
    PROCESS_MEMORY_CACHE_TTL: process.env.PROCESS_MEMORY_CACHE_TTL || ms('24h'),
    BUSY_THRESHOLD: process.env.BUSY_THRESHOLD || ms('15s')
  }
}

export const config = serverConfigSchema.parse(CONFIG_ENVS[MODE])
