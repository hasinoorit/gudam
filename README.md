# gudam (Store in Bengali)

A tiny store management library for react.

## Why gudam?

- Lightweight (1kb <)
- Fast
- Easy
- Scalable
- Built with love

## Installation

```bash
npm i gudam
```

## Initiating store

```js
// App.jsx
import { GudamContext, useGudam } from 'gudam' // importing gudam

function App() {
  const gudam = useGudam() // initiating gudam
  return (
    <GudamContext.Provider value={gudam}>
      {/_ Gudam provided _/}
      <div>Foo</div>
    </GudamContext.Provider>
  )
}

export default App
```

## Define store

```js
// authStore.js
import { defineStore } from 'gudam'

export const gudamAuth = defineStore({
  state() {
    return {
      username: '',
    }
  },
  getters: {
    greetings() {
      return this.username ? `Welcome back ${this.username}` : `Welcome Guest`
    },
  },
  actions: {
    setUsername(name: string) {
      this.username = name
    },
  },
})
```

## Using store

```js
import { gudamAuth } from '../store/authStore'

const Greeting = () => {
  const auth = gudamAuth() // initiating store accessor instance
  const loginAsDemo = () => {
    auth.setUsername('Demo') // accessing method to commit changes in store
  }
  return (
    <>
      <div>{auth.greetings}</div>
      {!auth.username && (
        <div>
          <button onClick={loginAsDemo}>Login as Demo User</button>
        </div>
      )}
    </>
  )
}
export default Greeting
```

## Re-render

```js
// authStore.js
export const gudamAuth = defineStore({
  state() {
    return {
      token: '',
      profile: {
        lastName: '',
        email: '',
        role: '',
      },
      loading: false,
    }
  },
  getters: {
    greetings() {
      return this.token && this.profile.email
        ? `Welcome back ${this.profile.lastName}`
        : `Welcome Guest`
    },
  },
  actions: {
    async login(username, password, onError = (e) => {}) {
      try {
        this.loading = true // trigger Effect
        const data = await loginService(username, password)
        this.token = data.token // trigger Effect
        this.profile.email = data.profile.email // No effect
        this.profile.lastName = data.profile.lastName // No effect
        this.profile.role = data.profile.role // No effect
        this.loading = false // trigger Effect
      } catch (error) {
        onError(error)
      }
    },
    logout() {
      this.$reset() // Built-in method to reset store & trigger effect
    },
  },
})
```

## Store inside store

```js
export const gudamUser = defineStore({
  state() {
    return {
      firstName: '',
      lastName: '',
    }
  },
  getters: {
    auth() {
      return gudamAuth()
    },
  },
  actions: {
    logout() {
      this.$reset()
      this.auth.$reset()
    },
  },
})
```

## Want more?

Feel free to create an issue.
