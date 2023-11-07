/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState } from 'react'

export const GudamContext = createContext<any[]>([])

type MethodTypes<T> = {
  readonly [K in keyof T]: T[K] extends (...args: any[]) => any
    ? ReturnType<T[K]>
    : never
}
type Getters = Record<string, () => unknown>
type ResetInjector = { $reset: () => void }
type TriggerInjector = { $trigger: () => void }
type StoreState<
  S extends object,
  G extends Getters = {},
  A extends Record<string, Function> = {}
> = {
  state: () => S
  getters?: G & ThisType<S>
  actions?: A &
    ThisType<S & MethodTypes<G> & ResetInjector & TriggerInjector & A>
}

type UnknownStore = StoreState<
  { [key: string]: any },
  { [key: string]: any },
  { [key: string]: Function }
>

// eslint-disable-next-line react-refresh/only-export-components
const createGudam = () => {
  const stores: UnknownStore[] = []
  const useGudam = () => {
    const [state, setState] = useState(() => {
      const $trigger = () => {
        setState((oldState) =>
          oldState.map(
            (store) =>
              new Proxy(store, {
                set() {
                  return true
                },
              })
          )
        )
      }
      return stores.map((option) => {
        let currentState = option.state()
        const $this: any = {
          $reset: () => {
            currentState = option.state()
            $trigger()
          },
          $trigger: $trigger,
        }
        for (const key in currentState) {
          if (Object.prototype.hasOwnProperty.call(currentState, key)) {
            Reflect.defineProperty($this, key, {
              get() {
                return currentState[key]
              },
              set(v) {
                currentState[key] = v
                $trigger()
              },
            })
          }
        }
        if (option.getters) {
          for (const key in option.getters) {
            if (Object.prototype.hasOwnProperty.call(option.getters, key)) {
              const getter = option.getters[key]
              Reflect.defineProperty($this, key, {
                get: getter.bind($this),
              })
            }
          }
        }
        if (option.actions) {
          for (const key in option.actions) {
            if (Object.prototype.hasOwnProperty.call(option.actions, key)) {
              const action = option.actions[key]
              Reflect.set($this, key, action.bind($this))
            }
          }
        }
        return $this
      })
    })
    return state
  }
  const defineStore = <
    S extends object,
    G extends Getters,
    // eslint-disable-next-line @typescript-eslint/ban-types
    A extends Record<string, Function>
  >(
    options: StoreState<S, G, A>
  ) => {
    const storeId = stores.length
    stores.push(options)
    const useStore = () => {
      const ctx = useContext(GudamContext)
      return ctx[storeId] as S & MethodTypes<G> & ResetInjector & A
    }
    return useStore
  }
  return { useGudam, defineStore }
}

export const { useGudam, defineStore } = createGudam()
