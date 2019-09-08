<template>
  <div class="flex flex-col items-center">
    <h2 class="text-2xl font-medium">Ooops! That did not work.</h2>
    <p class="text-xl">
      {{ error.message }}
    </p>
    <nuxt-link
      to="/"
      class="mt-2 underline"
    >
      Back to the start
    </nuxt-link>
  </div>
</template>

<script>
export default {
  props: ['error'],
  layout: 'empty',
}
</script>
