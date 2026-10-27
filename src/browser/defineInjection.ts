import { inject, type InjectionKey, provide } from 'vue';

/**
 * Build a typed provide/use pair backed by a unique InjectionKey.
 * The `use` half throws if called outside a matching provider, so consumers
 * never deal with `T | undefined`.
 *
 *   export const [provideSearch, useSearch] = defineInjection<SearchStore>('search');
 */
export function defineInjection<T>(name: string) {
  const key: InjectionKey<T> = Symbol(name);
  const provideValue = (value: T): void => provide(key, value);
  const useValue = (): T => {
    const value = inject(key);
    if (!value) throw new Error(`use(${name}) called outside its provider`);
    return value;
  };
  return [provideValue, useValue] as const;
}
