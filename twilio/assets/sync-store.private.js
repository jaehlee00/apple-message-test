'use strict';
module.exports = function syncStore(client, context) {
  const items = client.sync.v1.services(context.SYNC_SERVICE_SID).syncMaps(context.SYNC_MAP_SID).syncMapItems;
  return {
    async claim(key,data) {
      try { await items.create({key,data}); return { claimed:true }; }
      catch (originalError) {
        // Read the exact key instead of interpreting an assumed error code.
        // A timed-out create can have succeeded; treating it as claimed by
        // another invocation deliberately favors no duplicate delivery.
        try { const existing = await items(key).fetch(); return { claimed:false, data:existing.data }; }
        catch { throw originalError; }
      }
    },
    async finish(key,data) { await items(key).update({data}); }
  };
};
