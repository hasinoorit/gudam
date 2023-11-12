# Gudam (গুদাম): Streamlining React State Management

![Gudam Banner](/assets/gudam.jpg)

## Introduction

**Gudam** is a powerful yet lightweight React state management library that significantly enhances your application's performance. With a remarkably small footprint of just 1kb, it offers quick execution, straightforward implementation, scalability, and robust support for plugins. This TypeScript-based library ensures reliable and statically-typed state management for your React applications.

## Installation

Getting started with Gudam is a breeze. You can install it using npm with the following command:

```bash
npm install gudam
```

## Setting Up the Store

Integrating Gudam into your root component is a simple process. Follow these steps:

```javascript
import { GudamContext, useGudam } from 'gudam'

function App() {
  const gudam = useGudam()
  return (
    <GudamContext.Provider value={gudam}>
      {/* Your application is now powered by Gudam */}
      <div>Your App Content</div>
    </GudamContext.Provider>
  )
}

export default App
```

## Creating a Store

Define a store in Gudam using the `defineStore` function. Here's an example of how to define a store for authentication:

```javascript
import { defineStore, gudamPersistPlugin } from 'gudam'

export const gudamAuth = defineStore({
  state() {
    return {
      token: '',
      role: '',
      profile: {
        firstName: '',
        lastName: '',
      },
    }
  },
  getters: {
    isLoggedIn() {
      return !!this.token && !!this.role
    },
    greetings() {
      return this.profile.firstName
        ? `Welcome back ${this.profile.firstName}`
        : 'Welcome Guest'
    },
  },
  actions: {
    setAuth(token, role) {
      this.token = token
      this.role = role
    },
    setFirstName(name: string) {
      this.profile = { ...this.profile, firstName: name }
    },
  },
  plugins: [
    gudamPersistPlugin({
      key: 'auth',
      version: '0.0.1',
      session: false,
      parser: JSON.parse,
    }),
  ],
})
```

### State (Required)

The `state` property takes a function as a parameter and expects an object as the return value. This returned object becomes the source of truth for your store:

```javascript
export const authGudam = defineStore({
  state: () => {
    return {
      token: '',
      role: '',
      profile: {
        firstName: '',
        lastName: '',
      },
    }
  },
})
```

### Getters (Optional)

Getters allow you to define computed properties. Getter methods do not accept parameters, and you can access the state's properties using the `this` keyword inside getter methods. Each getter method should return a value:

```javascript
export const authGudam = defineStore({
  ...
  getters: {
    isLoggedIn() {
      return !!this.token && !!this.role
    },
    ...
  },
})
```

Please note that getters do not accept asynchronous functions.

### Actions (Optional)

Actions consist of methods that can accept parameters and modify the current state. Action methods can also be asynchronous:

```javascript
export const authGudam = defineStore({
  // ...
  actions: {
    setAuth(token, role) {
      this.token = token
      this.role = role
    },
    ...
  },
})
```

### Plugins (Optional)

Gudam supports plugins. You can include them by providing an array of plugins in your store definition:

```javascript
export const authGudam = defineStore({
  // ...
  plugins: [
    gudamPersistPlugin({
      key: 'auth',
      version: '0.0.1',
      session: false,
      parser: JSON.parse,
    }),
  ],
})
```

## Triggering Effects

Gudam automatically triggers effects whenever changes are made to any state property. However, changes to nested state properties do not trigger effects. You can manually trigger effects by calling `this.$trigger()`:

```javascript
export const authGudam = defineStore({
  // ...
  actions: {
    setFirstName(name: string) {
      this.profile = { ...this.profile, firstName: name }
      this.$trigger()
    },
  },
})
```

## Resetting the Store

To reset the entire store to its initial state, you can use the `this.$reset()` method. This can be particularly useful when you need to clear the store and start fresh:

```javascript
export const authGudam = defineStore({
  // ...
  actions: {
    resetStore() {
      this.$reset()
    },
  },
})
```

## Accessing the Store

You can access and utilize the store in your components as follows:

```javascript
import { gudamAuth } from '../store/authStore'

const Greeting = () => {
  const auth = gudamAuth()
  const loginAsDemo = () => {
    auth.setFirstName('Demo')
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

## Preloading Data

You can use the `$preload` built-in function to preload data into your store. It can commit changes without triggering effects and runs only once:

```javascript
import { GudamContext, useGudam } from 'gudam'
import { gudamAuth } from '../store/authStore'

function App() {
  const gudam = useGudam()
  const auth = gudamAuth(gudam) // providing the gudam instance because the context is not provided yet
  auth.$preload(() => {
    // Callback where we can silently update the store once.
    auth.setFirstName('Hasinoor')
    // perform some more synchronous operations
  })
  return (
    <GudamContext.Provider value={gudam}>
      {/* Your application is now empowered by Gudam */}
      <div>Your App Content</div>
    </GudamContext.Provider>
  )
}

export default App
```

Please note that once the store is changed, `$preload` does not execute its callback, and it does not support asynchronous operations.

## Store Inside Store

Gudam follows a modular design, allowing you to use one store inside another. This can be achieved by creating an instance of the store:

```javascript
export const gudamAccount = defineStore({
  state() {
    return {
      balance: 0,
    }
  },
  getters: {
    auth() {
      return gudamAuth() // Create an instance of gudamAuth
    },
  },
  actions: {
    logout() {
      this.$reset()
      this.auth.$reset() // Access gudamAuth via getters
    },
  },
})
```

## Persist Plugin

You can easily persist your store using the persist plugin:

```javascript
import { gudamPersistPlugin } from 'gudam'

export const gudamAuth = defineStore({
  // ...
  plugins: [
    gudamPersistPlugin({
      key: 'auth',
    }),
  ],
})
```

## Persist Plugin Options

The persist plugin accepts an object as a parameter with properties such as `key`, `version`, `session`, and `parser`. Here are the details:

| Property | Description                                             | Type                    | Required | Default Value |
| -------- | ------------------------------------------------------- | ----------------------- | -------- | ------------- |
| key      | A unique identifier for your store                      | String                  | Yes      | N/A           |
| version  | The version number of your current store                | String                  | No       | 0.0.1         |
| session  | Set the storage from `localStorage` to `sessionStorage` | Boolean                 | No       | False         |
| parser   | Parse the saved string of your state to an object       | (str: String) => Object | No       | JSON.parse    |

Please note that the persist plugin is not recommended for use with server-side rendering (SSR), as it can lead to hydration issues.

## Plugin API

A Gudam plugin should be an object with the following properties:

```typescript
type GudamPlugin<S extends object = {}> = {
  initState?: (initialState: S) => unknown
  onChange?: (newState: S) => void
}
```

- **initState:** This function is called with the current initial state value during the initiation of your store. It should return a state object, which will be used as the initial state.

- **onChange:** This function is called with the `newState` parameter whenever there is a change in your store.

Please note that plugins execute in the order in which they are placed.

## Need Help?

If you require further assistance or have any questions, please don't hesitate to create an issue. The Gudam team is committed to simplifying your state management experience!
