import path from 'node:path'
import fs from 'node:fs'

import { z } from 'zod'

import { domainConfigSchema } from './domain/index.js'

const walletPath = process.env.PATH_TO_WALLET
const walletKey = JSON.parse(fs.readFileSync(path.resolve(walletPath), 'utf8'))

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
  port: z.preprocess((val) => {
    if (!val) return -1
    if (typeof val === 'number') return val
    return typeof val === 'string' ? parseInt(val) : -1
  }, z.number().positive())
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
    port: process.env.PORT || 3005,
    MU_WALLET: walletKey,
    CU_URL: process.env.CU_URL || 'http://localhost:6363',
    GATEWAY_URL: process.env.GATEWAY_URL || 'https://arweave.net',
    SCHEDULED_INTERVAL: process.env.SCHEDULED_INTERVAL || 500,
    DUMP_PATH: process.env.DUMP_PATH || '',
    UPLOADER_URL: process.env.UPLOADER_URL || 'https://up.arweave.net'
  },
  production: {
    MODE,
    port: process.env.PORT || 3005,
    MU_WALLET: walletKey,
    CU_URL: process.env.CU_URL,
    GATEWAY_URL: process.env.GATEWAY_URL,
    SCHEDULED_INTERVAL: process.env.SCHEDULED_INTERVAL || 500,
    DUMP_PATH: process.env.DUMP_PATH || '',
    UPLOADER_URL: process.env.UPLOADER_URL || 'https://up.arweave.net'
  }
}

export const config = serverConfigSchema.parse(CONFIG_ENVS[MODE])
