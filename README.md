# Gudam (গুদাম): Simplifying React State Management

![Gudam Banner](/assets/gudam.jpg)

## Introduction

**Gudam** stands as a robust yet lightweight React state management library, designed to elevate your application's performance. With an impressively small footprint of just 1kb, it boasts quick execution, straightforward implementation, and scalability. This TypeScript-based library ensures reliable and statically-typed state management for your React applications.

## Installation

Getting started with Gudam is a breeze. Simply install it using npm with the following command:

```bash
npm install gudam
```

## Setting Up Gudam

Integrating Gudam into your root component is a straightforward process. Follow these steps:

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

Define a store in Gudam using the `defineStore` function. The following example illustrates how to define a store for authentication, including additional details:

```javascript
import { defineStore } from 'gudam'

export const authGudam = defineStore(
  'auth', // Unique key
  {
    // states
    token: '', // Authentication token
    role: '', // User role
    profile: {
      firstName: '', // User's first name
      lastName: '', // User's last name
    },
    // accessors
    get isLoggedIn() {
      return !!this.token && !!this.role; // Check if the user is logged in
    },
    get greetingMessage() {
      return this.profile.firstName
        ? `Welcome back ${this.profile.firstName}`
        : 'Welcome Guest';
    },
    // methods
    setAuth(token, role) {
      this.token = token;
      this.role = role;
    },
    setFirstName(name: string) {
      this.profile = { ...this.profile, firstName: name };
    },
  },
  {
    version: '0.0.1', // Version of the store
    storage: localStorage, // Storage engine (localStorage or sessionStorage)
    parse: JSON.parse, // Parser function to parse from string to store state
    stringify: JSON.stringify, // Converts stateful properties of your store to JSON string
  }
);
```

`defineStore` accepts three parameters:

1. **`key`**: A unique identifier for your store.
2. **`store`**: Your store object with states, accessors, and methods.

   - `states`: Non-function-type writable properties are states. In our `authGudam` store, we have `token`, `role`, and `profile` states.
   - `accessors`: Accessors are functions with the `get` identifier, providing a way to access computed or derived properties from the state.
   - `methods`: Methods are pure JavaScript functions. You can use these functions to make changes to your store states.

   > The store object is a regular JavaScript object, except that it triggers effects if changes are made to any state property.

3. **`persistOptions`** (optional): An object with persist options.

   | Property  | Description                                                                                           | Default Value  |
   | --------- | ----------------------------------------------------------------------------------------------------- | -------------- |
   | storage\* | Storage engine (`localStorage` or `sessionStorage`). It is required to enable persistence             | undefined      |
   | version   | Version of your current store. Change the version to invalidate old store values in the browser cache | 0.0.1          |
   | parse     | Parser function to convert from string to store state                                                 | JSON.parse     |
   | stringify | Converts stateful properties of your store to a JSON string                                           | JSON.stringify |

## Accessing the Store

Access and utilize the store in your components as follows:

```javascript
import { gudamAuth } from '../store/authStore'

const Greeting = () => {
  const auth = gudamAuth()
  const loginAsDemo = () => {
    auth.setFirstName('Demo')
  }

  return (
    <>
      <div>{auth.greetingMessage}</div>
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

You can use the `$preload` built-in function to preload data into your store. It takes a callback function that receives an object with initial state values and returns the updated state. The following example provides additional details:

```javascript
import { GudamContext, useGudam } from 'gudam'
import { gudamAuth } from '../store/authStore'

function App() {
  const gudam = useGudam()
  const auth = gudamAuth(gudam) // providing the gudam instance because the context is not provided yet
  auth.$preload((states) => {
    return { ...states, token: 'jwt-token', role: 'user' }
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
export const gudamAccount = defineStore('account', {
  balance: 0,
  get auth() {
    return gudamAuth() // Create an instance of gudamAuth
  },
  doSomething() {
    this.auth.setFirstName('Hasinoor')
  },
})
```

## Need Help?

If you require further assistance or have any questions, please don't hesitate to create an issue. The Gudam team is committed to simplifying your state management experience!
