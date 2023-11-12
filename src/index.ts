import { createContext, useContext, useEffect, useState } from 'react'

export const GudamContext = createContext<any[]>([])

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
  initState?: (initialState: S) => unknown
  onChange?: (newState: S) => void
}
type StoreState<
  S extends object,
  G extends Getters = {},
  A extends Record<string, Function> = {}
> = {
  state: () => S
  getters?: G & ThisType<S>
  actions?: A &
    ThisType<S & MethodTypes<G> & ResetInjector & TriggerInjector & A>
  plugins?: GudamPlugin<S>[]
}

type UnknownStore = StoreState<
  { [key: string]: any },
  { [key: string]: any },
  { [key: string]: Function }
>

// eslint-disable-next-line react-refresh/only-export-components

const proxyfy = <T extends object>(data: T) =>
  new Proxy(data, {
    set() {
      return true
    },
  })

const createGudam = () => {
  const stores: UnknownStore[] = []
  const useGudam = () => {
    const [state, setState] = useState(() => {
      return stores.map((option, storeId) => {
        let isSilent = false
        let hasChanged = false
        const { plugins = [] } = option
        const changeListener = plugins.filter((hooks) => hooks.onChange)
        let currentState = option.state()
        plugins.forEach((hooks) => {
          if (hooks.initState) {
            currentState = hooks.initState(currentState) as any
          }
        })
        const onChange =
          changeListener.length > 0
            ? () => {
                changeListener.forEach((hooks) => {
                  hooks.onChange!(currentState)
                })
              }
            : null
        const $trigger = () => {
          if (!isSilent) {
            setState((oldState) =>
              oldState.map((store, index) =>
                index === storeId ? proxyfy($this) : store
              )
            )
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
        return $this
      })
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
    const storeId = stores.length
    stores.push(options as UnknownStore)
    const useStore = (ctx = useContext(GudamContext)) => {
      return ctx[storeId] as S & MethodTypes<G> & ResetInjector & A
    }
    return useStore
  }
  return { useGudam, defineStore }
}

export const { useGudam, defineStore } = createGudam()

const wait0 = () => new Promise<boolean>((resolve) => resolve(true))

export const gudamPersistPlugin = (config: {
  key: string
  version?: string
  session?: boolean
  parser?: (str: string) => object
}): GudamPlugin => {
  const storage =
    typeof sessionStorage !== 'undefined'
      ? config.session
        ? sessionStorage
        : localStorage
      : undefined
  const dataKey = 'gudam_data__' + config.key
  const dataVersion = 'gudam_version__' + config.key
  const { parser = JSON.parse, version = '0.0.1' } = config
  let hasPending = false
  return {
    initState(initialState) {
      if (!storage) {
        return initialState
      }
      const savedData = storage.getItem(dataKey)
      if (storage.getItem(dataVersion) != version || !savedData) {
        storage.setItem(dataVersion, version)
        storage.setItem(dataKey, JSON.stringify(initialState))
        return initialState
      }
      return parser(savedData)
    },
    onChange(newState) {
      if (!storage) {
        return
      }
      if (!hasPending) {
        hasPending = true
        wait0().then(() => {
          hasPending = false
          storage.setItem(dataKey, JSON.stringify(newState))
        })
      }
    },
  }
}

export const useGinit = (cb: () => void) => {
  if (typeof window === 'undefined') {
    cb()
  }
  useEffect(cb, [])
}
