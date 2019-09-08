<template>
  <div class="min-h-screen flex flex-col justify-center bg-blue-900">
    <div class="text-center text-gray-200 z-10">
      <h1 class="text-5xl uppercase font-black">
        f5inator
      </h1>
      <h2 class="text-lg font-medium">
        Keep this tab open for a notification when a website changes!
      </h2>
    </div>

    <div class="mt-10 px-8 md:px-16 text-gray-300 z-10">
      <nuxt />
    </div>

    <img
      class="absolute w-35vmin bottom-0 right-0 mb-4 mr-6 z-0 opacity-75"
      src="~/assets/inator.svg"
    />
  </div>
</template>

<style>
.min-h-screen {
  min-height: 100vh;
}

.w-35vmin {
  width: 35vmin;
}
</style>
