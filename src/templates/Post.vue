<template>
  <Layout>
    <div class="text-center title">
      <h1 class="display-5">{{ $page.post.title }}</h1>
      <p>
        <em>Posté le <span>{{ $page.post.date | getDate($page.post.date) }}</span></em>
      </p>
    </div>

    <div class="container">
      <article class="mt-4" v-html="$page.post.content" />
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
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import truncatise from 'truncatise'

const options = {
  TruncateLength: 200,
  TruncateBy : "characters",
  Strict : false,
  StripHTML : true,
  Suffix : ''
}

export default {
  metaInfo() {
    return {
      title: this.$page.post.title,
      meta: [
        {
          name: 'description',
          content: truncatise(this.$page.post.content, options)
        }
      ]
    }
  },
  filters: {
    getDate: (date) => dayjs(date).locale('fr').format('DD MMMM YYYY')
  }
}
</script>

<style scope>
img {
  display: block;
  margin: 0 auto;
}

.title {
  background: #f7cf7e;
  padding: 10px 0 5px 0;
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
