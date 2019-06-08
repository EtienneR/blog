<template>
  <Layout>
    <h1>Liste des posts</h1>
    <p>Bienvenue sur mon humble blog</p>
    <article v-for="post in $page.posts.edges">
      <h2>
        <a :href="post.node.path">
          {{ post.node.title }}
        </a>
      </h2>
    </article>
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
export default {
  metaInfo: {
    title: 'Bienvenue'
  }
}
</script>
