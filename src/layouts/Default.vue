<template>
  <div>
    <header class="py-2 text-center">
      <strong>
        <g-link to="/" title="Accueil">Etienne ROUZEAUD - Développeur Web</g-link>
      </strong>
    </header>
    <main>
      <slot />
    </main>
    <footer class="text-white mt-4">
      <ul class="nav nav-pills justify-content-center">
        <li v-for="item in items" :key="item.name">
          <a class="nav-link" :href="item.link" target="_blank" rel="noopener">{{ item.name }}</a>
        </li>
      </ul>
    </footer>
  </div>
</template>

<static-query>
query {
  metadata {
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
          name: "Github",
          link: "https://github.com/etienner"
        },
        {
          name: "Medium",
          link: "https://medium.com/@etiennerouzeaud"
        },
        {
          name: "Twitter",
          link: "https://twitter.com/etiennerouzeaud"
        }
      ]
    };
  }
};
</script>

<style>
header a:hover,
header a {
  color: #000;
  text-decoration: none;
}

footer ul li a,
footer ul li a:hover {
  color: #fff;
}

footer {
  background: #000;
}
</style>