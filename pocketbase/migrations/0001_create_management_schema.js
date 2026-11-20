migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    users.fields.add(
      new SelectField({
        name: 'role',
        required: true,
        values: ['gestor', 'atendimento', 'cliente'],
        maxSelect: 1,
      }),
    )
    users.fields.add(new TextField({ name: 'phone', required: true, max: 20 }))
    users.fields.add(new TextField({ name: 'cpf', required: true, max: 18 }))
    users.listRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'gestor')"
    users.viewRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'gestor')"
    users.createRule =
      "(@request.auth.id = '' && @request.body.role = 'cliente') || (@request.auth.role = 'gestor' && @request.body.role != '')"
    users.updateRule =
      "@request.auth.id != '' && ((id = @request.auth.id && @request.body.role:changed = false) || @request.auth.role = 'gestor')"
    users.deleteRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'gestor')"
    users.addIndex('idx_users_cpf', true, 'cpf', '')
    app.save(users)

    const settings = new Collection({
      name: 'settings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor'",
      updateRule: "@request.auth.role = 'gestor'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'key', type: 'text', required: true, max: 50 },
        { name: 'business_name', type: 'text', required: true, max: 120 },
        { name: 'tagline', type: 'text', max: 180 },
        { name: 'contact_phone', type: 'text', required: true, max: 20 },
        { name: 'pix_key', type: 'text', required: true, max: 160 },
        { name: 'map_query', type: 'text', required: true, max: 240 },
        { name: 'bank_name', type: 'text', max: 100 },
        { name: 'bank_agency', type: 'text', max: 30 },
        { name: 'bank_account', type: 'text', max: 40 },
        { name: 'commission_percent', type: 'number', min: 0, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON settings (key)'],
    })
    app.save(settings)

    const menuItems = new Collection({
      name: 'menu_items',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'description', type: 'text', max: 500 },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['comida', 'porcao', 'bebida'],
          maxSelect: 1,
        },
        { name: 'price', type: 'number', required: false, min: 0 },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['600x400'],
        },
        { name: 'image_url', type: 'url' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_menu_items_category ON menu_items (category)',
        'CREATE INDEX idx_menu_items_active ON menu_items (active)',
      ],
    })
    app.save(menuItems)

    const customers = new Collection({
      name: 'customers',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || user = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || user = @request.auth.id)",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'phone', type: 'text', required: true, max: 20 },
        { name: 'cpf', type: 'text', required: true, max: 18 },
        { name: 'notes', type: 'text', max: 1000 },
        { name: 'total_spent', type: 'number', min: 0 },
        { name: 'last_visit', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_customers_cpf ON customers (cpf)',
        'CREATE INDEX idx_customers_user ON customers (user)',
        'CREATE INDEX idx_customers_name ON customers (name)',
      ],
    })
    app.save(customers)

    const tabs = new Collection({
      name: 'tabs',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || (@request.auth.role = 'cliente' && @request.body.customer_user = @request.auth.id))",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'customer',
          type: 'relation',
          collectionId: customers.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'customer_user',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true, max: 120 },
        { name: 'phone', type: 'text', required: true, max: 20 },
        { name: 'cpf', type: 'text', required: true, max: 18 },
        { name: 'table_label', type: 'text', max: 40 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['aberta', 'aguardando_pagamento', 'paga', 'fechada'],
          maxSelect: 1,
        },
        { name: 'total', type: 'number', min: 0 },
        {
          name: 'payment_method',
          type: 'select',
          values: ['pix', 'dinheiro', 'cartao'],
          maxSelect: 1,
        },
        { name: 'pix_status', type: 'select', values: ['pendente', 'confirmado'], maxSelect: 1 },
        {
          name: 'attendant',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'attendant_name', type: 'text', max: 120 },
        { name: 'opened_at', type: 'date', required: true },
        { name: 'closed_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tabs_status ON tabs (status)',
        'CREATE INDEX idx_tabs_customer_user ON tabs (customer_user)',
        'CREATE INDEX idx_tabs_opened_at ON tabs (opened_at)',
      ],
    })
    app.save(tabs)

    const tabItems = new Collection({
      name: 'tab_items',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || tab.customer_user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || tab.customer_user = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || (@request.auth.role = 'cliente' && tab.customer_user = @request.auth.id))",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      fields: [
        {
          name: 'tab',
          type: 'relation',
          required: true,
          collectionId: tabs.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'menu_item',
          type: 'relation',
          collectionId: menuItems.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'item_name', type: 'text', required: true, max: 120 },
        { name: 'unit_price', type: 'number', required: false, min: 0 },
        { name: 'quantity', type: 'number', required: true, min: 1, onlyInt: true },
        { name: 'subtotal', type: 'number', required: false, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['solicitado', 'preparo', 'entregue', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text', max: 500 },
        {
          name: 'ordered_by',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'commission_amount', type: 'number', min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tab_items_tab ON tab_items (tab)',
        'CREATE INDEX idx_tab_items_menu_item ON tab_items (menu_item)',
        'CREATE INDEX idx_tab_items_created ON tab_items (created)',
      ],
    })
    app.save(tabItems)

    const serviceRates = new Collection({
      name: 'service_rates',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor'",
      updateRule: "@request.auth.role = 'gestor'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'name', type: 'text', required: true, max: 120 },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['pesca', 'locacao'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', max: 500 },
        { name: 'price', type: 'number', required: false, min: 0 },
        { name: 'duration', type: 'text', required: true, max: 80 },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_service_rates_type ON service_rates (type)'],
    })
    app.save(serviceRates)

    const activities = new Collection({
      name: 'activities',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['pesca', 'locacao'],
          maxSelect: 1,
        },
        {
          name: 'rate',
          type: 'relation',
          collectionId: serviceRates.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customers.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'customer_user',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true, max: 120 },
        { name: 'item_name', type: 'text', required: true, max: 120 },
        { name: 'amount', type: 'number', required: false, min: 0 },
        { name: 'start_at', type: 'date', required: true },
        { name: 'end_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['reservada', 'em_andamento', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text', max: 500 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_activities_type ON activities (type)',
        'CREATE INDEX idx_activities_start_at ON activities (start_at)',
        'CREATE INDEX idx_activities_status ON activities (status)',
      ],
    })
    app.save(activities)

    const parking = new Collection({
      name: 'parking_reservations',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'gestor' || @request.auth.role = 'atendimento' || customer_user = @request.auth.id)",
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'spot', type: 'text', required: true, max: 20 },
        { name: 'vehicle', type: 'text', required: true, max: 100 },
        { name: 'plate', type: 'text', required: true, max: 12 },
        {
          name: 'customer',
          type: 'relation',
          collectionId: customers.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'customer_user',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true, max: 120 },
        { name: 'start_at', type: 'date', required: true },
        { name: 'end_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['reservada', 'ocupada', 'liberada', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_parking_spot ON parking_reservations (spot)',
        'CREATE INDEX idx_parking_status ON parking_reservations (status)',
      ],
    })
    app.save(parking)

    const visits = new Collection({
      name: 'visits',
      type: 'base',
      listRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      viewRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'customer',
          type: 'relation',
          collectionId: customers.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true, max: 120 },
        { name: 'phone', type: 'text', required: true, max: 20 },
        { name: 'cpf', type: 'text', required: true, max: 18 },
        {
          name: 'purpose',
          type: 'select',
          required: true,
          values: ['restaurante', 'pesca', 'locacao', 'visita'],
          maxSelect: 1,
        },
        { name: 'checked_in_at', type: 'date', required: true },
        { name: 'checked_out_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_visits_checked_in ON visits (checked_in_at)'],
    })
    app.save(visits)

    const financial = new Collection({
      name: 'financial_entries',
      type: 'base',
      listRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      viewRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['entrada', 'saida'],
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: [
            'restaurante',
            'pesca',
            'locacao',
            'estacionamento',
            'fornecedor',
            'manutencao',
            'outros',
          ],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true, max: 240 },
        { name: 'amount', type: 'number', required: false, min: 0 },
        { name: 'entry_date', type: 'date', required: true },
        {
          name: 'source_type',
          type: 'select',
          values: ['manual', 'comanda', 'atividade'],
          maxSelect: 1,
        },
        { name: 'source_id', type: 'text', max: 30 },
        {
          name: 'registered_by',
          type: 'relation',
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_financial_entry_date ON financial_entries (entry_date)',
        'CREATE INDEX idx_financial_type ON financial_entries (type)',
        'CREATE INDEX idx_financial_source ON financial_entries (source_type, source_id)',
      ],
    })
    app.save(financial)

    const reviews = new Collection({
      name: 'reviews',
      type: 'base',
      listRule: "approved = true || user = @request.auth.id || @request.auth.role = 'gestor'",
      viewRule: "approved = true || user = @request.auth.id || @request.auth.role = 'gestor'",
      createRule: "@request.auth.role = 'cliente'",
      updateRule: "user = @request.auth.id || @request.auth.role = 'gestor'",
      deleteRule: "user = @request.auth.id || @request.auth.role = 'gestor'",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'customer_name', type: 'text', required: true, max: 120 },
        { name: 'rating', type: 'number', required: true, min: 1, max: 5, onlyInt: true },
        { name: 'suggestion', type: 'text', required: true, max: 2000 },
        {
          name: 'photos',
          type: 'file',
          maxSelect: 6,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['600x600'],
        },
        { name: 'approved', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_reviews_approved ON reviews (approved)'],
    })
    app.save(reviews)

    const promotions = new Collection({
      name: 'promotions',
      type: 'base',
      listRule: "active = true || @request.auth.role = 'gestor'",
      viewRule: "active = true || @request.auth.role = 'gestor'",
      createRule: "@request.auth.role = 'gestor'",
      updateRule: "@request.auth.role = 'gestor'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        { name: 'title', type: 'text', required: true, max: 120 },
        { name: 'text', type: 'text', required: true, max: 1000 },
        { name: 'promotion_date', type: 'date', required: true },
        {
          name: 'destination',
          type: 'select',
          required: true,
          values: ['whatsapp', 'instagram', 'facebook', 'todos'],
          maxSelect: 1,
        },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['800x500'],
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_promotions_date ON promotions (promotion_date)'],
    })
    app.save(promotions)
  },
  (app) => {
    const collections = [
      'promotions',
      'reviews',
      'financial_entries',
      'visits',
      'parking_reservations',
      'activities',
      'service_rates',
      'tab_items',
      'tabs',
      'customers',
      'menu_items',
      'settings',
    ]
    for (const name of collections) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.removeIndex('idx_users_cpf')
    users.fields.removeByName('role')
    users.fields.removeByName('phone')
    users.fields.removeByName('cpf')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
