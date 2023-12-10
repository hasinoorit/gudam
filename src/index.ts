import { useState, createContext, useContext } from 'react'
export const GudamContext = createContext<Record<string, unknown>>({})
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B
type WritableKeysOf<T> = {
  [P in keyof T]: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >
}[keyof T]
type WritablePart<T> = Pick<T, WritableKeysOf<T>>
type FunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

type OnlyState<T> = Omit<
  WritablePart<T>,
  FunctionPropertyNames<WritablePart<T>>
>

type PreloadCB<T> = (initialState: OnlyState<T>) => OnlyState<T>
type $Preload<T> = {
  $preload: (cb: PreloadCB<T>) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PersistOptions<T extends object = any> = {
  storage?: Storage
  version?: string
  stringify?: (value: T) => string
  parse?: (str: string) => T
}
const clone = <T extends object>(store: T) =>
  new Proxy(store, {
    set() {
      return true
    },
  })

const createGudam = () => {
  const stores: Record<string, object> = {}
  const persistRecords: Record<string, PersistOptions> = {}
  const defineStore = <T extends object>(
    storeKey: string,
    store: T,
    persistOptions: PersistOptions<OnlyState<T>> = {}
  ) => {
    stores[storeKey] = store
    persistRecords[storeKey] = persistOptions
    const useStore = (ctx = useContext(GudamContext)): T & $Preload<T> => {
      return ctx[storeKey] as T & $Preload<T>
    }
    return useStore
  }
  const useGudam = () => {
    const [state, setState] = useState(() => {
      const storesInstance: Record<string, object> = {}
      for (const key in stores) {
        if (Object.prototype.hasOwnProperty.call(stores, key)) {
          let hasChanged = false
          const descriptions = Object.getOwnPropertyDescriptors(stores[key])
          let states: Record<string, unknown> = {}
          let hasPending = false
          const dataKey = `gudam_data__${key}`
          const versionKey = `gudam_version__${key}`
          const {
            storage,
            parse = JSON.parse,
            stringify = JSON.stringify,
            version = '0.0.1',
          } = persistRecords[key]
          const persist = storage
            ? () => {
              if (!hasPending) {
                hasPending = true
                setTimeout(() => {
                  hasPending = false
                  storage.setItem(dataKey, stringify(states))
                }, 0)
              }
            }
            : () => { }
          const store = {
            $preload: (cb: PreloadCB<object>) => {
              if (!hasChanged) {
                states = cb(states)
                hasChanged = true
                persist()
              }
            },
          }
          for (const key in descriptions) {
            if (Object.prototype.hasOwnProperty.call(descriptions, key)) {
              const item = descriptions[key]
              if (item.writable && typeof item.value !== 'function') {
                states[key] = item.value
                Object.defineProperty(store, key, {
                  get() {
                    return states[key]
                  },
                  set(v) {
                    states[key] = v
                    hasChanged = true
                    setState((oldState: object) => ({
                      ...oldState,
                      [key]: clone(store),
                    }))
                    persist()
                  },
                })
              } else if (typeof item.value === 'function') {
                Object.defineProperty(store, key, {
                  ...item,
                  value: item.value.bind(store),
                })
              } else {
                Object.defineProperty(store, key, item)
              }
            }
          }
          if (storage) {
            const oldVersion = storage.getItem(versionKey)
            if (oldVersion !== version) {
              storage.setItem(dataKey, stringify(states))
              storage.setItem(versionKey, version)
            } else {
              const oldData = storage.getItem(dataKey)
              if (oldData) {
                states = parse(oldData)
              }
            }
          }
          storesInstance[key] = clone(store)
        }
      }
      return storesInstance
    })
    return state
  }
  return { defineStore, useGudam }
}

export const { defineStore, useGudam } = createGudam()
