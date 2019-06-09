<template>
  <div>
    <header>
      <div class="container text-center">
        <strong>
          <g-link to="/" title="Accueil">Etienne ROUZEAUD - Développeur Web</g-link>
        </strong>
      </div>
    </header>
    <slot />
    <footer class="text-white mt-4">
      <ul class="nav nav-pills justify-content-center">
        <li v-for="item in items">
          <a class="nav-link" :href="item.link" target="_blank">{{ item.name }}</a>
        </li>
      </ul>
    </footer>
  </div>
</template>

<static-query>
query {
  metaData {
    siteName
  }
}
</static-query>

<script>
export default {
  data() {
    return {
      items: [
        {
          name: 'Github',
          link: 'https://github.com/etienner'
        },
        {
          name: 'Medium',
          link: 'https://medium.com/@etiennerouzeaud'
        },
        {
          name: 'Twitter',
          link: 'https://twitter.com/etiennerouzeaud'
        }
      ]
    }
  }
}
</script>

<style>
header {
  background: #428884;
  padding: 15px 0;
}

header a,
footer ul li a {
  color: #fff;
}

header a:hover,
footer a:hover {
  color: #f7cf7e;
  text-decoration: none;
}

a {
  color: #428884;
}

footer {
  background: #428884;
}
</style>