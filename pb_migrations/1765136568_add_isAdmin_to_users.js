/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Check if field already exists
  const existing = collection.fields.getByName("isAdmin")
  if (!existing) {
    collection.fields.add(new Field({
      system: false,
      id: "nqv0n1it",
      name: "isAdmin",
      type: "bool",
      required: false,
      presentable: false,
      unique: false,
      options: {}
    }))
  }

  return app.save(collection)
}, (app) => {
  // Rollback: remove isAdmin field
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  
  const field = collection.fields.getByName("isAdmin")
  if (field) {
    collection.fields.remove(field.id)
  }

  return app.save(collection)
})

