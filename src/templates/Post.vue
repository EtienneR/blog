<template>
  <Layout>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a href="/">Accueil</a>
        </li>
        <li class="breadcrumb-item active" aria-current="page">{{ $page.post.title }}</li>
      </ol>
    </nav>

    <div class="text-center">
      <h1 class="display-5">{{ $page.post.title }}</h1>
      <p>
        <em>Posté le <span>{{ $page.post.date | getDate($page.post.date) }}</span></em>
      </p>
    </div>

    <article class="mt-4" v-html="$page.post.content" />
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

export default {
  metaInfo() {
    return {
      title: this.$page.post.title
    }
  },
  filters: {
    getDate: (date)  => dayjs(date).locale('fr').format('DD MMMM YYYY')
  }
}
</script>

<style scope>
img{
  display: block;
  margin: 0 auto;
}
</style>
