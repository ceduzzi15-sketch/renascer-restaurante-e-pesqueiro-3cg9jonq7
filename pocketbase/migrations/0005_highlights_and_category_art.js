migrate(
  (app) => {
    // 1. Campos de destaque em menu_items (marcados via CSV de destaques)
    const menuItems = app.findCollectionByNameOrId('menu_items')

    if (!menuItems.fields.getByName('destaque')) {
      menuItems.fields.add(new BoolField({ name: 'destaque' }))
    }
    if (!menuItems.fields.getByName('destaque_posicao')) {
      menuItems.fields.add(new NumberField({ name: 'destaque_posicao', min: 0 }))
    }

    menuItems.addIndex('idx_menu_items_destaque', false, 'destaque', '')
    app.save(menuItems)

    // 2. Arte (upload de imagem) em menu_categories
    const menuCategories = app.findCollectionByNameOrId('menu_categories')

    if (!menuCategories.fields.getByName('art_image')) {
      menuCategories.fields.add(
        new FileField({
          name: 'art_image',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
          thumbs: [],
        }),
      )
    }
    app.save(menuCategories)
  },
  (app) => {
    try {
      const menuItems = app.findCollectionByNameOrId('menu_items')
      menuItems.removeIndex('idx_menu_items_destaque')
      menuItems.fields.removeByName('destaque')
      menuItems.fields.removeByName('destaque_posicao')
      app.save(menuItems)
    } catch (_) {}

    try {
      const menuCategories = app.findCollectionByNameOrId('menu_categories')
      menuCategories.fields.removeByName('art_image')
      app.save(menuCategories)
    } catch (_) {}
  },
)
