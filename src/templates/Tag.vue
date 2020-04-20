<template>
  <Layout>
    <Hero
      :title="$page.tag.title" 
      :subtitle="`${$page.tag.belongsTo.totalCount} articles trouvés`" /> 
    <Posts :posts="$page.tag.belongsTo.edges" />
  </Layout>
</template>

<page-query>
query Tag ($id: ID!, $page: Int) {
  tag: tag (id: $id) {
    title
    belongsTo (page: $page, perPage: 100) @paginate {
      totalCount
      edges {
        node {
          ...on Post {
            title
    	      date (format: "D MMMM YYYY")
            path
            tags {
              title
            }
          }
        }
      }
    }
  }
}
</page-query>

<script>
import Hero from "../components/Hero.vue"
import Posts from "../components/Posts.vue"

export default {
  components: { Posts, Hero },
  metaInfo() {
    return {
      title: this.$page.tag.title
    }
  }
}
</script>
