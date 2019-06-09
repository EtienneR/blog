<template>
  <Layout>
    <div class="home-title">
      <div class="container">
        <h1 class="text-center">Blog d'un passionné du Web</h1>
        <p>Laborum dolor officia excepteur laborum consequat aliquip ut ut nisi nisi sint. Deserunt laboris reprehenderit Lorem id mollit exercitation ea. Tempor adipisicing qui ex est ullamco exercitation veniam ad fugiat tempor anim. Voluptate nisi consectetur qui esse amet officia.</p>
        <p>Laboris veniam aliquip officia et. Qui laboris elit enim tempor. Elit duis fugiat quis eiusmod. Duis in mollit incididunt nulla pariatur laborum aliqua reprehenderit dolore.</p>
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
export default {
  metaInfo: {
    title: 'Bienvenue'
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
