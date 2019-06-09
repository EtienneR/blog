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
  </div>
</template>

<static-query>
query {
  metaData {
    siteName
  }
}
</static-query>

<style>
header {
  background: #428884;
  padding: 15px 0;
}

header a {
  color: #fff;
}

header a:hover {
  color: #f7cf7e;
  text-decoration: none;
}

a {
  color: #428884;
}
</style>