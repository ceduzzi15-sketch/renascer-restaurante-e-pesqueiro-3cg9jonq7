migrate(
  (app) => {
    const collection = new Collection({
      name: 'gallery_media',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['foto', 'video'],
          maxSelect: 1,
        },
        {
          name: 'file',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 104857600,
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ],
        },
        {
          name: 'caption',
          type: 'text',
          max: 160,
        },
        {
          name: 'order',
          type: 'number',
          onlyInt: true,
        },
        {
          name: 'featured',
          type: 'bool',
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: ['CREATE INDEX idx_gallery_media_order ON gallery_media (order)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('gallery_media')
    app.delete(collection)
  },
)
