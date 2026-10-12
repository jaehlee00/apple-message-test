import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const original = await readFile(new URL('finance/dist/client/data/chart.json', root));
const chart = JSON.parse(original);
const manifest = {
  schemaVersion: 1,
  chartID: 'b71d8906-be7f-499e-a448-044d4ec39825',
  revisionID: 'f47530da-762a-44a1-9c52-ab142462bf6f',
  title: chart.title,
  retrievedOn: '2026-10-12',
  dataMode: 'verified-snapshot',
  currency: 'USD',
  valueBasis: 'base USD',
  displayDivisor: 1000000000,
  sourceSnapshotSHA256: createHash('sha256').update(original).digest('hex'),
  rows: chart.table.rows,
  sources: chart.source.query.source_refs.map(s => ({
    id: s.id, provider: s.provider, url: s.source_locator.url,
    pageNumber: s.source_locator.page_number
  }))
};
if (manifest.rows.length !== 4 || manifest.rows.some(r => r.currency !== 'USD' || !Number.isSafeInteger(r.value))) {
  throw new Error('Unexpected source dataset. Review before exporting.');
}
const bytes = JSON.stringify(manifest, null, 2) + '\n';
await writeFile(new URL('ios/Shared/chart-manifest.json', root), bytes);
await writeFile(new URL('twilio/assets/chart-manifest.private.json', root), bytes);
await copyFile(new URL('public/revenue-preview.png', root), new URL('ios/Shared/revenue-preview.png', root));
await copyFile(new URL('public/revenue-preview.png', root), new URL('twilio/assets/revenue-preview.png', root));
await copyFile(new URL('finance/dist/client/index.html', root), new URL('twilio/assets/chart-runtime.private.html', root));
console.log('Native and Twilio snapshots created from the existing Financial Charts export; no financial retrieval.');
