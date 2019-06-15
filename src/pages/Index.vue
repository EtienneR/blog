<template>
  <Layout>
    <div class="home-title">
      <div class="container">
        <h1 class="text-center">Blog d'un passionné du Web</h1>
        <p>{{ description }}</p>
      </div>
    </div>
    <div class="container mt-4">
      <ul class="list-unstyled">
        <li v-for="post in $page.posts.edges">
          <a :href="post.node.path" class="h4">
            {{ post.node.title }}
          </a>
        </li>
      </ul>
    </div>
  </Layout>
</template>

<page-query>
query Posts {
  posts: allPost(sortBy: "date", order: DESC, perPage: 100) {
    edges {
      node {
        title
        date
        path
      }
    }
  }
}
</page-query>

<script>
const description = "En tant que développeur Web fullstack, ce blog regroupe un ensemble d'articles techniques sur divers sujets tels que JavaScript, Golang, PHP et d'autres."

export default {
  data() {
    return {
      description: description
    }
  },
  metaInfo: {
    title: "Blog d'un développeur Web",
    meta: [
      {
        name: 'description',
        content: description
      }
    ]
  }
}
</script>

<style>
.home-title {
  background: #f7cf7e;
  padding: 10px 0 5px 0;
}
h1 {
  color: #428884;
}

ul li a {
  color: #000;
}
</style>
