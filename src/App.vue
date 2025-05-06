<template>
  <div id="app-container">
    <header>
      <nav>
        <router-link to="/">管理后台</router-link> |
        <router-link to="/live">直播页面</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>&copy; {{ new Date().getFullYear() }} 比赛平台</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this basic layout
</script>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

header {
  background-color: #34495e;
  padding: 15px 30px;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

nav a {
  font-weight: bold;
  color: #ecf0f1;
  text-decoration: none;
  margin: 0 10px;
}

nav a.router-link-exact-active {
  color: #f1c40f; /* Highlight active link */
}

main {
  flex-grow: 1;
  padding: 20px;
  background-color: #ecf0f1;
}

footer {
  background-color: #2c3e50;
  color: #bdc3c7;
  text-align: center;
  padding: 10px 0;
  font-size: 0.9em;
}
</style>
