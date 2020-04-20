<template>
  <Layout>
    <Hero 
      title="Blog d'un passionné du Web"
      :subtitle="description" />

    <Posts :posts="$page.posts.edges" />
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
import Hero from "../components/Hero.vue"
import Posts from "../components/Posts.vue"

const description =
  "En tant que développeur Web fullstack, ce blog regroupe un ensemble d'articles techniques sur divers sujets tels que JavaScript, Golang, PHP et d'autres.";

export default {
  components: { Hero, Posts },
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
