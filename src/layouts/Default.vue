<template>
  <div class="container">
    <header>
      <strong>
        <g-link to="/" title="Accueil">Etienne ROUZEAUD</g-link>
      </strong>
    </header>
    <slot class="mt-4" />
  </div>
</template>

<static-query>
query {
  metaData {
    siteName
  }
}
</static-query>
