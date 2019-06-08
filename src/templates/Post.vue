<template>
  <Layout>
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
