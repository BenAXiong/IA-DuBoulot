import { listStoryboardLocatorKeys } from "./storyboard-schema.mjs";

export function createLocatorAdapter(definitions) {
  if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) {
    throw new Error("Locator definitions must be an object of resolver functions.");
  }

  const entries = Object.entries(definitions);

  for (const [key, resolver] of entries) {
    if (!key.includes(".")) {
      throw new Error(`Locator key "${key}" must be namespaced.`);
    }

    if (typeof resolver !== "function") {
      throw new Error(`Locator resolver "${key}" must be a function.`);
    }
  }

  const frozenDefinitions = Object.freeze({ ...definitions });

  return Object.freeze({
    keys: Object.freeze(entries.map(([key]) => key).sort()),
    resolve(page, key) {
      const resolver = frozenDefinitions[key];

      if (!resolver) {
        throw new Error(`No locator resolver is registered for "${key}".`);
      }

      const locator = resolver(page);

      if (!locator || typeof locator !== "object") {
        throw new Error(`Locator resolver "${key}" did not return a locator.`);
      }

      return locator;
    },
  });
}

export function assertStoryboardLocators(storyboard, adapter) {
  if (!adapter || !Array.isArray(adapter.keys)) {
    throw new Error("A locator adapter created by createLocatorAdapter is required.");
  }

  const required = listStoryboardLocatorKeys(storyboard);
  const available = new Set(adapter.keys);
  const missing = required.filter((key) => !available.has(key));

  if (missing.length > 0) {
    throw new Error(`Missing locator resolvers: ${missing.join(", ")}.`);
  }

  return Object.freeze({ required, missing: [] });
}
