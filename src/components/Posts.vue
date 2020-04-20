<template>
  <div class="container mt-4">
    <ul class="list-unstyled">
      <li v-for="(post, index) in posts" :key="index">
        <a :href="post.node.path" class="h5">{{ post.node.title }}</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    posts: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
ul li {
  margin: 15px 10px;
  border: 1px solid #000;
  display: inline-block;
}

ul li a {
  color: #000;
  display: inline-block;
  margin: 0;
  padding: 8px;
  min-width: 100%;
}

ul li a:hover {
  background: #000;
  color: #fff;
  text-decoration: none;
}

@media screen and (max-width: 800px) {
  ul li {
    display: block;
  }
}
</style>
