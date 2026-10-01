export const STORYBOARD_SCHEMA_VERSION = 1;

export const ACTION_TYPES = Object.freeze([
  "navigate",
  "click",
  "fill",
  "press",
  "wait-for",
  "checkpoint",
  "accept-coaching-response",
]);

const ACTION_TYPE_SET = new Set(ACTION_TYPES);
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const LOCATOR_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/;

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertIdentifier(value, label) {
  assertNonEmptyString(value, label);

  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${label} must be a lowercase kebab-case identifier.`);
  }
}

function assertLocatorKey(value, label) {
  assertNonEmptyString(value, label);

  if (!LOCATOR_KEY_PATTERN.test(value)) {
    throw new Error(
      `${label} must be a namespaced locator key such as "landing.primaryCta".`,
    );
  }
}

function assertRelativeRoute(value, label) {
  assertNonEmptyString(value, label);

  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error(`${label} must be a same-origin route beginning with "/".`);
  }
}

function validateAction(action, sceneId, actionIndex) {
  const label = `Scene "${sceneId}" action ${actionIndex + 1}`;
  assertPlainObject(action, label);

  if (!ACTION_TYPE_SET.has(action.type)) {
    throw new Error(`${label} has unsupported type "${action.type}".`);
  }

  switch (action.type) {
    case "navigate":
      assertRelativeRoute(action.path, `${label} path`);
      break;
    case "click":
    case "wait-for":
      assertLocatorKey(action.target, `${label} target`);
      break;
    case "fill":
      assertLocatorKey(action.target, `${label} target`);
      assertNonEmptyString(action.valueRef, `${label} valueRef`);
      if ("value" in action) {
        throw new Error(`${label} must reference input data instead of embedding it.`);
      }
      break;
    case "press":
      assertLocatorKey(action.target, `${label} target`);
      assertNonEmptyString(action.key, `${label} key`);
      break;
    case "checkpoint":
      assertIdentifier(action.name, `${label} name`);
      break;
    case "accept-coaching-response":
      assertNonEmptyString(action.contractId, `${label} contractId`);
      assertLocatorKey(action.target, `${label} target`);
      break;
  }

  if (action.timeoutMs !== undefined) {
    if (!Number.isInteger(action.timeoutMs) || action.timeoutMs <= 0) {
      throw new Error(`${label} timeoutMs must be a positive integer.`);
    }
  }

  return Object.freeze({ ...action });
}

export function validateStoryboard(candidate) {
  assertPlainObject(candidate, "Storyboard");

  if (candidate.schemaVersion !== STORYBOARD_SCHEMA_VERSION) {
    throw new Error(
      `Storyboard schemaVersion must be ${STORYBOARD_SCHEMA_VERSION}.`,
    );
  }

  assertIdentifier(candidate.id, "Storyboard id");
  assertNonEmptyString(candidate.title, "Storyboard title");

  if (!Array.isArray(candidate.scenes) || candidate.scenes.length === 0) {
    throw new Error("Storyboard must contain at least one scene.");
  }

  const sceneIds = new Set();
  const checkpointNames = new Set();
  const scenes = candidate.scenes.map((scene, sceneIndex) => {
    const label = `Scene ${sceneIndex + 1}`;
    assertPlainObject(scene, label);
    assertIdentifier(scene.id, `${label} id`);
    assertNonEmptyString(scene.title, `${label} title`);
    assertNonEmptyString(scene.purpose, `${label} purpose`);

    if (sceneIds.has(scene.id)) {
      throw new Error(`Duplicate scene id "${scene.id}".`);
    }

    sceneIds.add(scene.id);

    if (!Array.isArray(scene.actions) || scene.actions.length === 0) {
      throw new Error(`Scene "${scene.id}" must contain at least one action.`);
    }

    const actions = scene.actions.map((action, actionIndex) =>
      validateAction(action, scene.id, actionIndex),
    );

    for (const action of actions) {
      if (action.type !== "checkpoint") {
        continue;
      }

      if (checkpointNames.has(action.name)) {
        throw new Error(`Duplicate checkpoint name "${action.name}".`);
      }

      checkpointNames.add(action.name);
    }

    return Object.freeze({
      id: scene.id,
      title: scene.title.trim(),
      purpose: scene.purpose.trim(),
      enabled: scene.enabled !== false,
      actions,
    });
  });

  return Object.freeze({
    schemaVersion: STORYBOARD_SCHEMA_VERSION,
    id: candidate.id,
    title: candidate.title.trim(),
    scenes,
  });
}

export function listStoryboardLocatorKeys(storyboard) {
  const validated = validateStoryboard(storyboard);
  const keys = new Set();

  for (const scene of validated.scenes) {
    for (const action of scene.actions) {
      if (action.target) {
        keys.add(action.target);
      }
    }
  }

  return [...keys].sort();
}
