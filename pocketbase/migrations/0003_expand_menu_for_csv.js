migrate(
  (app) => {
    // 1. Criar collection menu_categories se ainda não existir
    let menuCategories
    try {
      menuCategories = app.findCollectionByNameOrId('menu_categories')
    } catch (_) {
      menuCategories = new Collection({
        name: 'menu_categories',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
        updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
        deleteRule: "@request.auth.role = 'gestor'",
        fields: [
          { name: 'category_id', type: 'text', required: true, max: 100 },
          { name: 'name', type: 'text', required: true, max: 150 },
          { name: 'subtitle', type: 'text', max: 200 },
          { name: 'order', type: 'number', min: 0 },
          { name: 'item_count', type: 'number', min: 0 },
          { name: 'art_svg', type: 'text', max: 150 },
          { name: 'art_png', type: 'text', max: 150 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_menu_categories_cat_id ON menu_categories (category_id)',
          'CREATE INDEX idx_menu_categories_order ON menu_categories (order)',
        ],
      })
      app.save(menuCategories)
    }

    // 2. Expandir collection menu_items com os campos de subcategoria, observação, categoria dinâmica e ordens
    const menuItems = app.findCollectionByNameOrId('menu_items')

    if (!menuItems.fields.getByName('categoria_id')) {
      menuItems.fields.add(new TextField({ name: 'categoria_id', max: 100 }))
    }
    if (!menuItems.fields.getByName('category_name')) {
      menuItems.fields.add(new TextField({ name: 'category_name', max: 150 }))
    }
    if (!menuItems.fields.getByName('subcategoria')) {
      menuItems.fields.add(new TextField({ name: 'subcategoria', max: 150 }))
    }
    if (!menuItems.fields.getByName('observacao')) {
      menuItems.fields.add(new TextField({ name: 'observacao', max: 500 }))
    }
    if (!menuItems.fields.getByName('ordem')) {
      menuItems.fields.add(new NumberField({ name: 'ordem', min: 0 }))
    }
    if (!menuItems.fields.getByName('categoria_ordem')) {
      menuItems.fields.add(new NumberField({ name: 'categoria_ordem', min: 0 }))
    }
    if (!menuItems.fields.getByName('preco_formatado')) {
      menuItems.fields.add(new TextField({ name: 'preco_formatado', max: 50 }))
    }

    menuItems.addIndex('idx_menu_items_categoria_id', false, 'categoria_id', '')
    menuItems.addIndex('idx_menu_items_ordem', false, 'ordem', '')

    app.save(menuItems)
  },
  (app) => {
    try {
      const menuItems = app.findCollectionByNameOrId('menu_items')
      menuItems.removeIndex('idx_menu_items_categoria_id')
      menuItems.removeIndex('idx_menu_items_ordem')
      menuItems.fields.removeByName('categoria_id')
      menuItems.fields.removeByName('category_name')
      menuItems.fields.removeByName('subcategoria')
      menuItems.fields.removeByName('observacao')
      menuItems.fields.removeByName('ordem')
      menuItems.fields.removeByName('categoria_ordem')
      menuItems.fields.removeByName('preco_formatado')
      app.save(menuItems)
    } catch (_) {}

    try {
      const menuCategories = app.findCollectionByNameOrId('menu_categories')
      app.delete(menuCategories)
    } catch (_) {}
  },
)
