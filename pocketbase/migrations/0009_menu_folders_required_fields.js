migrate(
  (app) => {
    // ---------- Pastas (setores) do cardápio ----------
    const folders = new Collection({
      name: 'menu_folders',
      type: 'base',
      // Leitura pública (landing e cardápio); gestão para perfis internos.
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_menu_folders_order ON menu_folders ("order")'],
    })
    app.save(folders)

    // Campo que liga cada categoria à sua pasta.
    const categories = app.findCollectionByNameOrId('menu_categories')
    if (!categories.fields.getByName('folder')) {
      categories.fields.add(new TextField({ name: 'folder', max: 0 }))
    }
    app.save(categories)

    // Pastas padrão sugeridas pelo dono (idempotente: só se a coleção estiver vazia).
    const folderExisting = app.findRecordsByFilter('menu_folders', '', '', 1, 0).length
    if (folderExisting === 0) {
      ;[
        'Almoço e Porções',
        'Bebidas não alcoólicas e Cervejas',
        'Drinks e Doses',
        'Pesca, caiaques e estacionamento',
      ].forEach((name, index) => {
        const folder = new Record(folders)
        folder.set('name', name)
        folder.set('order', index)
        app.save(folder)
      })
    }

    // ---------- Campos obrigatórios configuráveis (documento único) ----------
    const requiredConfig = new Collection({
      name: 'required_fields_config',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'gestor'",
      updateRule: "@request.auth.role = 'gestor'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'required_fields', type: 'json', maxSize: 2000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(requiredConfig)

    if (app.findRecordsByFilter('required_fields_config', '', '', 1, 0).length === 0) {
      const record = new Record(requiredConfig)
      record.set('required_fields', { name: true, phone: true, cpf: true, email: false })
      app.save(record)
    }

    // ---------- Tabelas editáveis: estacionamento entra como tipo de valor ----------
    const rates = app.findCollectionByNameOrId('service_rates')
    const typeField = rates.fields.getByName('type')
    if (typeField && !typeField.values.includes('estacionamento')) {
      typeField.values.push('estacionamento')
    }
    // Atendimento também gerencia a tabela (usada na aba Operações do painel).
    rates.updateRule = "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'"
    rates.createRule = "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'"
    rates.deleteRule = "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'"
    app.save(rates)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('required_fields_config'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('menu_folders'))
    } catch (_) {}
    try {
      const categories = app.findCollectionByNameOrId('menu_categories')
      if (categories.fields.getByName('folder')) {
        categories.fields.removeByName('folder')
      }
      app.save(categories)
    } catch (_) {}
    try {
      const rates = app.findCollectionByNameOrId('service_rates')
      const typeField = rates.fields.getByName('type')
      if (typeField) {
        typeField.values = typeField.values.filter((value) => value !== 'estacionamento')
      }
      rates.updateRule = "@request.auth.role = 'gestor'"
      rates.createRule = "@request.auth.role = 'gestor'"
      rates.deleteRule = "@request.auth.role = 'gestor'"
      app.save(rates)
    } catch (_) {}
  },
)
