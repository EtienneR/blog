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

    <h1>{{ $page.post.title }}</h1>
    <p><em>Posté le <span>{{ $page.post.date }}</span></em></p>

    <article v-html="$page.post.content" />
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
export default {
  metaInfo() {
    return {
      title: this.$page.post.title
    }
  }
}
</script>

<style scope>
img{
  display: block;
  margin: 0 auto;
}
</style>
