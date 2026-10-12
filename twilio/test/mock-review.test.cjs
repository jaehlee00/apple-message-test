'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { confirmReview } = require('../assets/mock-review.private.js');
const { CHART_ID, REVISION_ID } = require('../assets/core.private.js');
const valid = () => ({ schemaVersion: 1, requestID: '01bc2b3a-8aaf-4222-9f4c-40e1cc7d15a1',
  chartID: CHART_ID, revisionID: REVISION_ID, action: 'confirm_snapshot_review' });

test('mock confirmation echoes correlation and explicit mock result', () => {
  const input = valid(), r = confirmReview(input);
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.requestID, input.requestID);
  assert.equal(r.body.receiptID, 'mock-' + input.requestID);
  assert.equal(r.body.mode, 'mock'); assert.equal(r.body.status, 'confirmed');
  assert.equal(r.body.chartID, CHART_ID); assert.equal(r.body.revisionID, REVISION_ID);
  assert.deepEqual(input, valid());
});
test('replay of a mock request returns the identical result', () => {
  assert.deepEqual(confirmReview(valid()), confirmReview(valid()));
});
test('unknown action, cancel and malformed snapshot cannot confirm', () => {
  for (const change of [{action:'cancel'}, {action:'buy'}, {chartID:'other'},
    {revisionID:'other'}, {requestID:'bad'}, {requestID:[valid().requestID]}, {schemaVersion:2}, {schemaVersion:'1'}]) {
    const r = confirmReview({...valid(), ...change});
    assert.equal(r.statusCode, 422); assert.equal(r.body.status, undefined);
  }
});
test('arbitrary extra financial fields are rejected', () => {
  for (const extra of [{holdings:[]}, {amount:500}, {apiURL:'https://example.invalid'}]) {
    assert.equal(confirmReview({...valid(), ...extra}).body.error, 'UNEXPECTED_FIELD');
  }
});
test('missing data returns an error, never a fabricated receipt', () => {
  for (const input of [null, undefined, {}, []]) {
    const r = confirmReview(input); assert.equal(r.statusCode, 422);
    assert.equal(r.body.receiptID, undefined);
  }
});
