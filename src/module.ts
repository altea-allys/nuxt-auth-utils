import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addServerHandler } from '@nuxt/kit'
import { sha256 } from 'ohash'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'auth-utils',
    configKey: 'auth'
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (!process.env.NUXT_SESSION_PASSWORD && !nuxt.options._prepare) {
      const randomPassword = sha256(`${Date.now()}${Math.random()}`).slice(0, 32)
      process.env.NUXT_SESSION_PASSWORD = randomPassword
      console.warn('No session password set, using a random password, please set NUXT_SESSION_PASSWORD in your .env file with at least 32 chars')
      console.log(`NUXT_SESSION_PASSWORD=${randomPassword}`)
    }

    nuxt.options.alias['#auth-utils'] = resolver.resolve('./runtime/types/auth-utils-session')

    // App
    addImportsDir(resolver.resolve('./runtime/composables'))
    addPlugin(resolver.resolve('./runtime/plugins/session.server'))
    // Server
    if (nuxt.options.nitro.imports !== false) {
      // TODO: address https://github.com/Atinux/nuxt-auth-utils/issues/1 upstream in unimport
      nuxt.options.nitro.imports = defu(nuxt.options.nitro.imports, {
        presets: [
          {
            from: resolver.resolve('./runtime/server/utils/oauth'),
            imports: ['oauth']
          },
          {
            from: resolver.resolve('./runtime/server/utils/session'),
            imports: [
              'getUserSession',
              'setUserSession',
              'clearUserSession',
              'requireUserSession',
            ]
          }
        ]
      })
    }
    // Waiting for https://github.com/nuxt/nuxt/pull/24000/files
    // addServerImportsDir(resolver.resolve('./runtime/server/utils'))
    addServerHandler({
      handler: resolver.resolve('./runtime/server/api/session.delete'),
      route: '/api/_auth/session',
      method: 'delete'
    })
    addServerHandler({
      handler: resolver.resolve('./runtime/server/api/session.get'),
      route: '/api/_auth/session',
      method: 'get'
    })

    // Runtime Config
    const runtimeConfig = nuxt.options.runtimeConfig
    runtimeConfig.session = defu(runtimeConfig.session, {
      name: 'nuxt-session',
      password: ''
    })
    // OAuth settings
    runtimeConfig.oauth = defu(runtimeConfig.oauth, {})
    // GitHub Oauth
    runtimeConfig.oauth.github = defu(runtimeConfig.oauth.github, {
      clientId: '',
      clientSecret: ''
    })
    // Spotify Oauth
    runtimeConfig.oauth.spotify = defu(runtimeConfig.oauth.spotify, {
      clientId: '',
      clientSecret: ''
    })
    // Google Oauth
    runtimeConfig.oauth.google = defu(runtimeConfig.oauth.google, {
      clientId: '',
      clientSecret: ''
    })
    // Twitch Oauth
    runtimeConfig.oauth.twitch = defu(runtimeConfig.oauth.twitch, {
      clientId: '',
      clientSecret: ''
    })
        // Azure Oauth
    runtimeConfig.oauth.azure = defu(runtimeConfig.oauth.azure, {
      clientId: process.env.NUXT_OAUTH_AZURE_AD_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_AZURE_AD_CLIENT_SECRET,
      redirectUri: process.env.NUXT_OAUTH_AZURE_AD_REDIRECT_URI,
      tenantId: process.env.NUXT_OAUTH_AZURE_AD_TENANT_ID
    })
  }
})
