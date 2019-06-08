<template>
  <div class="container mt-4">
    <header>
      <strong>
        <g-link to="/" title="Accueil">Etienne ROUZEAUD</g-link>
      </strong>
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
