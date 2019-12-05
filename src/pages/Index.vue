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
          <a :href="post.node.path" class="h4">{{ post.node.title }}</a>
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
const description =
  "En tant que développeur Web fullstack, ce blog regroupe un ensemble d'articles techniques sur divers sujets tels que JavaScript, Golang, PHP et d'autres.";

export default {
  data() {
    return {
      description: description
    };
  },
  metaInfo: {
    title: "Blog d'un développeur Web",
    meta: [
      {
        name: "description",
        content: description
      },
      {
        name: "google-site-verification",
        content: "Ar41wZFdkm26rmqjauY6fC7EpRxmylZClc1j89GBjAQ"
      },

      { property: "og:type", content: "website" },
      { property: "og:title", content: "Blog d'un développeur Web" },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://etienner.github.io" },

      { name: "twitter:domain", content: "https://etienner.github.io" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Blog d'un développeur Web" },
      { name: "twitter:description", content: description },
      { name: "twitter:site", content: "@etiennerouzeaud" },
      { name: "twitter:creator", content: "@etiennerouzeaud" }
    ]
  }
};
</script>

<style>
.home-title {
  background: #091a28;
  color: #ddd;
  padding: 10px 0 5px 0;
}
h1 {
  color: #ddd;
}

ul li a {
  color: #000;
}
</style>
