<template>
  <Layout>
    <Hero :title="$page.post.title" />

    <div class="container">
      <div class="row">
        <div class="mt-4 col-lg-2">
          <p>
            <em>
              <span>{{ $page.post.date | getDate($page.post.date) }}</span>
            </em>
          </p>
          <ul v-if="$page.post.tags.length > 0" class="list-unstyled">
            <li v-for="(tag, index) in $page.post.tags" :key="index">
              🏷️ <g-link :to="tag.path">{{ tag.title }}</g-link>
            </li>
          </ul>
          <p class="download" v-if="$page.post.download">
            <a :href="$page.post.download" target="_blank" rel="noopener">
              💾 Téléchargement
            </a>
          </p>
        </div>
        <div class="col-lg-10 mt-4">
          <ul v-if="$page.post.parts.length > 0" class="list-group mb-4">
            <li v-for="(part, i) in $page.post.parts" :key="i" class="list-group-item" :class="!part.href ? 'disabled': ''">
              Partie {{ i+1 }} : 
              <span v-if="part.href">
                <g-link :to="part.href">{{ part.title }}</g-link>
              </span>
              <span v-else>{{ part.title }}</span>
            </li>
          </ul>
          <article v-html="$page.post.content" />
        </div>
      </div>
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    date (format: "D MMMM YYYY")
    content
    download
    tags {
      title
      path
    }
    parts {
      title
      href
    }
  }
}
</page-query>

<script>
import dayjs from "dayjs";
import "dayjs/locale/fr";
import truncatise from "truncatise";
import Hero from "../components/Hero.vue";
import config from "~/.temp/config.js";

const options = {
  TruncateLength: 200,
  TruncateBy: "characters",
  Strict: false,
  StripHTML: true,
  Suffix: ""
};

export default {
  components: { Hero },
  metaInfo() {
    return {
      title: this.$page.post.title,
      meta: [
        {
          name: "description",
          content: truncatise(this.$page.post.content, options)
        },

        { property: "og:type", content: "article" },
        { property: "og:title", content: this.$page.post.title },
        {
          property: "og:description",
          content: truncatise(this.$page.post.content, options)
        },
        { property: "og:url", content: this.postUrl },

        { name: "twitter:domain", content: this.config.siteUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: this.$page.post.title },
        {
          name: "twitter:description",
          content: truncatise(this.$page.post.content, options)
        },
        { name: "twitter:site", content: "@etiennerouzeaud" },
        { name: "twitter:creator", content: "@etiennerouzeaud" }
      ]
    };
  },
  computed: {
    config() {
      return config;
    },
    postUrl() {
      let siteUrl = this.config.siteUrl;
      let postSlug = this.$route.path;
      return `${siteUrl}${postSlug}`;
    }
  },
  filters: {
    getDate: date =>
      dayjs(date)
        .locale("fr")
        .format("DD MMMM YYYY")
  }
};
</script>

<style scope>
ul li a,
.download a {
  color: #000;
}

img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}

@media screen and (max-width: 1024px) {
  img {
    width: 100%;
  }
}
</style>
