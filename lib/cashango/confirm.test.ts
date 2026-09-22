import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateCngReturn, type ConfirmSession } from "./confirm";
import type { CngTransaction } from "./types";

const session: ConfirmSession = {
  id: "session-1",
  link_id: "link-1",
  status: "pending",
  order_number: "abc__1",
  expected_amount_cents: 150,
};

const paidTx: CngTransaction = {
  amount: 1.5,
  processed: 1,
  specialId: "JEI-S8b7Zt",
  webOrderNumber: "abc__1",
};

test("evaluateCngReturn rejects a missing order number", () => {
  const decision = evaluateCngReturn({
    orderNumber: "",
    session,
    cngTx: paidTx,
  });
  assert.deepEqual(decision, { action: "invalid", reason: "missing_order" });
});

test("evaluateCngReturn rejects an unknown checkout session", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session: null,
    cngTx: paidTx,
  });
  assert.deepEqual(decision, { action: "invalid", reason: "unknown_order" });
});

test("evaluateCngReturn waits when CNG has no row yet", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: null,
  });
  assert.deepEqual(decision, { action: "confirming", reason: "missing_cng" });
});

test("evaluateCngReturn waits when the CNG payment is not processed", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: { ...paidTx, processed: 0 },
  });
  assert.deepEqual(decision, { action: "confirming", reason: "not_processed" });
});

test("evaluateCngReturn waits when the order number does not match", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: { ...paidTx, webOrderNumber: "other" },
  });
  assert.deepEqual(decision, { action: "confirming", reason: "order_mismatch" });
});

test("evaluateCngReturn waits when the amount does not match", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: { ...paidTx, amount: 9.99 },
  });
  assert.deepEqual(decision, { action: "confirming", reason: "amount_mismatch" });
});

test("evaluateCngReturn settles a processed matching CNG transaction", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: paidTx,
  });
  assert.deepEqual(decision, { action: "settle" });
});

test("evaluateCngReturn ignores query-string STATUS and requires processed=1", () => {
  const decision = evaluateCngReturn({
    orderNumber: "abc__1",
    session,
    cngTx: { ...paidTx, processed: false },
  });
  assert.equal(decision.action, "confirming");
});
