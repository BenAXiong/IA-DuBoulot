import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDedicatedTaggedAccount,
  assertMutationConfirmed,
  parseMode,
} from "./seed-portfolio-demo.mjs";

test("portfolio demo mode requires exactly one operation", () => {
  assert.equal(parseMode(["--verify"]), "verify");
  assert.throws(() => parseMode([]), /Choose exactly one mode/);
  assert.throws(
    () => parseMode(["--seed", "--reset"]),
    /Choose exactly one mode/,
  );
});

test("portfolio mutations require an explicit hosted-write acknowledgement", () => {
  assert.doesNotThrow(() => assertMutationConfirmed("verify", []));
  assert.throws(
    () => assertMutationConfirmed("seed", ["--seed"]),
    /Hosted writes are disabled/,
  );
  assert.throws(
    () => assertMutationConfirmed("reset", ["--reset"]),
    /Hosted writes are disabled/,
  );
  assert.doesNotThrow(() =>
    assertMutationConfirmed("seed", ["--seed", "--confirm-hosted-write"]),
  );
});

test("portfolio operations refuse to adopt an unrelated existing account", () => {
  assert.doesNotThrow(() => assertDedicatedTaggedAccount(null, "student"));
  assert.doesNotThrow(() =>
    assertDedicatedTaggedAccount(
      { user_metadata: { portfolio_demo_tag: "portfolio_demo_matt_v1" } },
      "student",
    ),
  );
  assert.throws(
    () =>
      assertDedicatedTaggedAccount(
        { user_metadata: { portfolio_demo_tag: "some_other_account" } },
        "student",
      ),
    /Refusing to adopt/,
  );
});
