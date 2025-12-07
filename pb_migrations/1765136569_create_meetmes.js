/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Check if collection already exists
  try {
    const existingCollection = app.findCollectionByNameOrId('meetmes');
    if (existingCollection) {
      console.log('[MIGRATION] meetmes collection already exists, skipping creation.');
      return;
    }
  } catch (e) {
    // Collection doesn't exist, continue with creation
  }

  // Get users collection ID for relation field
  const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");

  const collection = new Collection({
    "name": "meetmes",
    "type": "base",
    "system": false,
    "fields": [
      {
        "cascadeDelete": true,
        "collectionId": usersCollection.id,
        "hidden": false,
        "id": "usrrel01",
        "maxSelect": 1,
        "minSelect": null,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "rqid12345",
        "max": null,
        "min": null,
        "name": "requestId",
        "onlyInt": true,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "nmfld001",
        "max": null,
        "min": null,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "phfld001",
        "max": null,
        "min": null,
        "name": "phone",
        "pattern": "",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "msgfld01",
        "max": null,
        "min": null,
        "name": "message",
        "pattern": "",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "stsfld01",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["pending", "approved", "in_progress", "delayed", "awaiting_reply", "rejected", "completed"]
      },
      {
        "hidden": false,
        "id": "subjfld1",
        "max": null,
        "min": null,
        "name": "subject",
        "pattern": "",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "options": {},
    "listRule": "user = @request.auth.id || @request.auth.isAdmin = true",
    "viewRule": "user = @request.auth.id || @request.auth.isAdmin = true",
    "createRule": "@request.auth.id != ''",
    "updateRule": "user = @request.auth.id || @request.auth.isAdmin = true",
    "deleteRule": "user = @request.auth.id || @request.auth.isAdmin = true"
  });

  // Add index for requestId
  collection.indexes.push("CREATE INDEX `idx_meetmes_request_id` ON `meetmes` (`requestId`)");

  return app.save(collection);
}, (app) => {
  // Rollback: Delete the collection
  try {
    const collection = app.findCollectionByNameOrId('meetmes');
    if (collection) {
      return app.delete(collection);
    }
  } catch (error) {
    // Collection doesn't exist or already deleted
  }
});
