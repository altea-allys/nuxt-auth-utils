<script setup>
const { loggedIn, session, clear } = useUserSession()
</script>

<template>
  <UHeader>
    <template #right>
      <UButton
        v-if="!loggedIn || !session.user.github"
        to="/auth/github"
        icon="i-simple-icons-github"
        external
        color="gray"
        size="xs"
      >
        Login with GitHub
      </UButton>
      <UButton
        v-if="!loggedIn || !session.user.spotify"
        to="/auth/spotify"
        icon="i-simple-icons-spotify"
        external
        color="gray"
        size="xs"
      >
        Login with Spotify
      </UButton>
      <UButton
        v-if="!loggedIn || !session.user.google"
        to="/auth/google"
        icon="i-simple-icons-google"
        external
        color="gray"
        size="xs"
      >
        Login with Google
      </UButton>
      <UButton
        v-if="loggedIn"
        color="gray"
        size="xs"
        @click="clear"
      >
        Logout
      </UButton>
      <UButton
        v-if="!loggedIn || !session.user.twitch"
        to="/auth/twitch"
        icon="i-simple-icons-twitch"
        external
        color="gray"
        size="xs"
      >
        Login with Twitch
      </UButton>
      <UButton
        v-if="!loggedIn || !session.user.azure"
        to="/auth/azure"
        icon="i-simple-icons-microsoft"
        external
        color="gray"
        size="xs"
      >
        Login with Azure
      </UButton>
    </template>
  </UHeader>
  <UMain>
    <UContainer>
      <NuxtPage />
    </UContainer>
  </UMain>
</template>
