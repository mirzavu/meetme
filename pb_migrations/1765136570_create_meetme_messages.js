/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Check if collection already exists
  try {
    const existingCollection = app.findCollectionByNameOrId('meetme_messages');
    if (existingCollection) {
      console.log('[MIGRATION] meetme_messages collection already exists, skipping creation.');
      return;
    }
  } catch (e) {
    // Collection doesn't exist, continue with creation
  }

  // Get the meetmes collection to reference its ID
  const meetmesCollection = app.findCollectionByNameOrId("meetmes");

  const collection = new Collection({
    "name": "meetme_messages",
    "type": "base",
    "system": false,
    "fields": [
      {
        "cascadeDelete": true,
        "collectionId": meetmesCollection.id,
        "hidden": false,
        "id": "mtmrel01",
        "maxSelect": 1,
        "minSelect": null,
        "name": "meetme",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "authfld1",
        "maxSelect": 1,
        "name": "authorType",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["user", "admin"]
      },
      {
        "hidden": false,
        "id": "msgfld02",
        "max": null,
        "min": null,
        "name": "message",
        "pattern": "",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      }
    ],
    "options": {},
    "listRule": "@request.auth.id != '' && (meetme.user = @request.auth.id || @request.auth.isAdmin = true)",
    "viewRule": "@request.auth.id != '' && (meetme.user = @request.auth.id || @request.auth.isAdmin = true)",
    "createRule": "@request.auth.id != ''",
    "updateRule": null,
    "deleteRule": "@request.auth.isAdmin = true"
  });

  return app.save(collection);
}, (app) => {
  // Rollback: Delete the collection
  try {
    const collection = app.findCollectionByNameOrId('meetme_messages');
    if (collection) {
      return app.delete(collection);
    }
  } catch (error) {
    // Collection doesn't exist or already deleted
  }
});
