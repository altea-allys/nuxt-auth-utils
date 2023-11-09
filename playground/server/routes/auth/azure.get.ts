export default oauth.azureEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        azure: user,
      },
      loggedInAt: Date.now()
    })

    return sendRedirect(event, '/')
  }
})