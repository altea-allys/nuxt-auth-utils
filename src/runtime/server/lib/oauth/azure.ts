import type { H3Event, H3Error } from 'h3'
import { eventHandler, createError, getQuery, getRequestURL, sendRedirect } from 'h3'
import { withQuery, parsePath } from 'ufo'
import { ofetch } from 'ofetch'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'

export interface OAuthAzureConfig {
  /**
   * Azure Client ID
   * @default process.env.NUXT_AZURE_AD_CLIENT_ID
   */
  clientId?: string

  /**
  * Azure OAuth Client Secret
  * @default process.env.NUXT_OAUTH_AZURE_AD_CLIENT_SECRET
  */
  clientSecret?: string

  /**
   * Azure OAuth Scope
   */
  scope?: string[]

  /**
   * Require email from user, adds the ['user:read:email'] scope if not present
   * @default false
   */
  emailRequired?: boolean

  /**
   * Azure OAuth Authorization URL
   */
  authorizationURL?: string

  /**
   * Azure OAuth Token URL
   */
  tokenURL?: string

  tenant?: string

}

interface OAuthConfig {
  config?: OAuthAzureConfig
  onSuccess: (event: H3Event, result: { user: any, tokens: any }) => Promise<void> | void
  onError?: (event: H3Event, error: H3Error) => Promise<void> | void
}

export function azureEventHandler ({ config, onSuccess, onError }: OAuthConfig) {

  return eventHandler(async (event: H3Event) => {

    // @ts-ignore
    config = defu(config, useRuntimeConfig(event).oauth?.azure, {

    }) as OAuthAzureConfig
    const { code } = getQuery(event)

    if (!config.tenant) {
      const error = createError({
        statusCode: 500,
        message: 'Missing NUXT_OAUTH_AZURE_AD_TENANT_ID env variables.'
      })
      if (!onError) throw error
      return onError(event, error)
    }

    if (!config.clientId) {
      const error = createError({
        statusCode: 500,
        message: 'Missing NUXT_OAUTH_AZURE_AD_CLIENT_ID env variables.'
      })
      if (!onError) throw error
      return onError(event, error)
    }

    const redirectUrl = getRequestURL(event).href
    const authorizationURL = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`,
    const tokenURL = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
    if (!code) {
      config.scope = config.scope || []
      if (config.emailRequired && !config.scope.includes('user.read')) {
        config.scope.push('user.read')
      }
      // Redirect to Azure Oauth page
      return sendRedirect(
        event,
        withQuery(authorizationURL as string, {
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: redirectUrl,
          scope: config.scope.join('%20')
        })
      )
    }

    const tokens: any = await ofetch(
      tokenURL as string,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          redirect_uri: parsePath(redirectUrl).pathname,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code
        })
      }
    ).catch(error => {
      return { error }
    })

    if (tokens.error) {
      const error = createError({
        statusCode: 401,
        message: `Azure login failed: ${tokens.error}`,
        data: tokens
      })
      if (!onError) throw error
      return onError(event, error)
    }

    async function fetchAzureUserInfo (accessToken: string): Promise<any> {
      const graphApiEndpoint = 'https://graph.microsoft.com/v1.0/me'

      const response = await ofetch(graphApiEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })


      return await response
    }

    const users: any = await fetchAzureUserInfo(tokens.access_token)

    const user = users

    if (!user) {
      const error = createError({
        statusCode: 500,
        message: 'Could not get Azure user',
        data: tokens
      })
      if (!onError) throw error
      return onError(event, error)
    }

    return onSuccess(event, {
      tokens,
      user
    })
  })
}
