import { createContext, useContext, useState } from 'react'

type EmptyStore = {
  $reset: () => void
  $trigger: () => void
  $preload: (cb: () => void) => void
}

type MethodTypes<T> = {
  readonly [K in keyof T]: T[K] extends (...args: any[]) => any
    ? ReturnType<T[K]>
    : never
}
type Getters = Record<string, () => unknown>
type ResetInjector = {
  $reset: () => void
  $preload: (cb: () => void) => void
}
type TriggerInjector = { $trigger: () => void }
export type GudamPlugin<S extends object = {}> = {
  initState?: (storeKey: string, initialState: S) => unknown
  onChange?: (storeKey: string, newState: S) => void
}
type StoreState<
  S extends object,
  G extends Getters = {},
  A extends Record<string, Function> = {}
> = {
  key: string
  state: () => S
  getters?: G & ThisType<S & G>
  actions?: A &
    ThisType<S & MethodTypes<G> & ResetInjector & TriggerInjector & A>
  plugins?: GudamPlugin<S>[]
}

type UnknownStore = StoreState<
  { [key: string]: any },
  { [key: string]: any },
  { [key: string]: Function }
>

type EmptyStoreS = Record<string, EmptyStore>

// eslint-disable-next-line react-refresh/only-export-components
export const GudamContext = createContext<EmptyStoreS>({})

const proxyfy = <T extends object>(data: T) =>
  new Proxy(data, {
    set() {
      return true
    },
  })

const createGudam = () => {
  const stores: Record<string, UnknownStore> = {}
  const useGudam = () => {
    const [state, setState] = useState(() => {
      const storeStates: EmptyStoreS = {}
      for (const key in stores) {
        if (Object.prototype.hasOwnProperty.call(stores, key)) {
          const option = stores[key]
          let isSilent = false
          let hasChanged = false
          const { plugins = [] } = option
          const changeListener = plugins.filter((hooks) => hooks.onChange)
          let currentState = option.state()
          plugins.forEach((hooks) => {
            if (hooks.initState) {
              currentState = hooks.initState(key, currentState) as any
            }
          })
          const onChange =
            changeListener.length > 0
              ? () => {
                  changeListener.forEach((hooks) => {
                    hooks.onChange!(key, currentState)
                  })
                }
              : null
          const $trigger = () => {
            if (!isSilent) {
              setState((oldState) => ({ ...oldState, key: proxyfy($this) }))
              if (onChange) {
                onChange()
              }
              hasChanged = true
            }
          }
          const $this = {
            $reset: () => {
              currentState = option.state()
              $trigger()
            },
            $trigger: $trigger,
            $preload: (cb: () => void) => {
              if (!hasChanged) {
                isSilent = true
                cb()
                isSilent = false
              }
              hasChanged = true
            },
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
          storeStates[key] = $this
        }
      }
      return storeStates
    })
    return state
  }
  const defineStore = <
    S extends object,
    G extends Getters,
    A extends Record<string, Function>
  >(
    options: StoreState<S, G, A>
  ) => {
    const { key } = options
    stores[key] = options as UnknownStore
    const useStore = (
      ctx = useContext(GudamContext)
    ): S & MethodTypes<G> & ResetInjector & A => {
      return (ctx[key] as any) || ({} as any)
    }
    return useStore
  }
  return { useGudam, defineStore }
}

export const { useGudam, defineStore } = createGudam()

const wait0 = () => new Promise<boolean>((resolve) => resolve(true))

export const gudamPersistPlugin = (
  config: {
    version?: string
    session?: boolean
    parse?: (str: string) => object
    stringify?: () => string
  } = {}
): GudamPlugin => {
  const storage =
    typeof sessionStorage !== 'undefined'
      ? config.session
        ? sessionStorage
        : localStorage
      : undefined
  const dataVersion = 'gudam_version__' + config.version
  const {
    parse = JSON.parse,
    version = '0.0.1',
    stringify = JSON.stringify,
  } = config
  let hasPending = false
  return {
    initState(key, initialState) {
      const dataKey = 'gudam_data__' + key
      if (!storage) {
        return initialState
      }
      const savedData = storage.getItem(dataKey)
      if (storage.getItem(dataVersion) != version || !savedData) {
        storage.setItem(dataVersion, version)
        storage.setItem(dataKey, stringify(initialState))
        return initialState
      }
      return parse(savedData)
    },
    onChange(key, newState) {
      const dataKey = 'gudam_data__' + key
      if (!storage) {
        return
      }
      if (!hasPending) {
        hasPending = true
        wait0().then(() => {
          hasPending = false
          storage.setItem(dataKey, stringify(newState))
        })
      }
    },
  }
}
