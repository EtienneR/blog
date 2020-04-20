<template>
  <div class="title py-2 text-center">
    <h1 class="display-5 pt-2">{{ title }}</h1>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      required: false,
      default: ""
    }
  }
}
</script>

<style scoped>
  .title {
    background: #091a28;
    color: #fff;
  }
</style>