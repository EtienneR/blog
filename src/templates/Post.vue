<template>
  <Layout>
    <div class="title">
      <h1 class="display-4 text-center">{{ $page.post.title }}</h1>
    </div>

    <div class="container">
      <div class="row">
        <div class="mt-4 col-lg-2">
          <p>
            <em>
              <span>{{ $page.post.date | getDate($page.post.date) }}</span>
            </em>
          </p>
        </div>
        <article class="mt-4 col-lg-10" v-html="$page.post.content" />
      </div>
    </div>
  </Layout>
</template>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title,
    date (format: "D MMMM YYYY"),
    content
  }
}
</page-query>

<script>
import dayjs from "dayjs";
import "dayjs/locale/fr";
import truncatise from "truncatise";
import config from "~/.temp/config.js";

const options = {
  TruncateLength: 200,
  TruncateBy: "characters",
  Strict: false,
  StripHTML: true,
  Suffix: ""
};

export default {
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
span {
  color: #091a28;
}

img {
  display: block;
  margin: 0 auto;
}

.title {
  background: #091a28;
  padding: 5px 0;
}

.title h1 {
  color: #ddd;
  padding: 0.5% 0;
}

/* < 1024 px */
img {
  max-width: 100%;
}

@media screen and (max-width: 1024px) {
  img {
    width: 100%;
  }
}
</style>
