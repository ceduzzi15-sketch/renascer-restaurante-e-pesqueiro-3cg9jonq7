migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let manager
    try {
      manager = app.findAuthRecordByEmail('_pb_users_auth_', 'ceduzzi15@gmail.com')
    } catch (_) {
      manager = new Record(users)
      manager.setEmail('ceduzzi15@gmail.com')
      manager.setPassword('Skip@Pass')
      manager.setVerified(true)
      manager.set('name', 'Gestor Principal')
      manager.set('role', 'gestor')
      manager.set('phone', '(19) 99168-9268')
      manager.set('cpf', '000.000.000-00')
      app.save(manager)
    }

    const ensureRecord = (collectionName, field, value, data) => {
      try {
        return app.findFirstRecordByData(collectionName, field, value)
      } catch (_) {
        const collection = app.findCollectionByNameOrId(collectionName)
        const record = new Record(collection)
        for (const key in data) record.set(key, data[key])
        app.save(record)
        return record
      }
    }

    ensureRecord('settings', 'key', 'main', {
      key: 'main',
      business_name: 'Recanto do Pescador',
      tagline: 'Boa pesca, comida de verdade e momentos à beira do lago.',
      contact_phone: '19 991689268',
      pix_key: '19 991689268',
      map_query: 'Pesqueiro e Restaurante, São Paulo',
      bank_name: '',
      bank_agency: '',
      bank_account: '',
      commission_percent: 5,
    })

    const menuData = [
      {
        name: 'Tilápia crocante',
        description: 'Filés empanados, limão e molho da casa.',
        category: 'porcao',
        price: 58,
        image_url:
          'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/7a8428af-8e09-43d2-b840-a6a54ffb50da/pq7-b285d.jpg',
        active: true,
      },
      {
        name: 'Peixe na brasa',
        description: 'Peixe fresco preparado na brasa, acompanhado de arroz e salada.',
        category: 'comida',
        price: 72,
        image_url:
          'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/7a8428af-8e09-43d2-b840-a6a54ffb50da/pq6-90044.jpg',
        active: true,
      },
      {
        name: 'Isca de peixe',
        description: 'Porção generosa, dourada e sequinha.',
        category: 'porcao',
        price: 49,
        image_url:
          'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/7a8428af-8e09-43d2-b840-a6a54ffb50da/pq7-b285d.jpg',
        active: true,
      },
      {
        name: 'Refrigerante lata',
        description: 'Lata 350 ml, sabores variados.',
        category: 'bebida',
        price: 7,
        image_url: '',
        active: true,
      },
      {
        name: 'Suco natural',
        description: 'Feito na hora com frutas selecionadas.',
        category: 'bebida',
        price: 12,
        image_url: '',
        active: true,
      },
    ]
    for (const item of menuData) ensureRecord('menu_items', 'name', item.name, item)

    const ratesData = [
      {
        name: 'Diária de pesca — adulto',
        type: 'pesca',
        description: 'Acesso ao lago durante todo o período diurno.',
        price: 45,
        duration: '07h às 18h',
        active: true,
      },
      {
        name: 'Meia diária de pesca',
        type: 'pesca',
        description: 'Período de até 5 horas no lago.',
        price: 30,
        duration: '5 horas',
        active: true,
      },
      {
        name: 'Caiaque individual',
        type: 'locacao',
        description: 'Colete salva-vidas incluso.',
        price: 35,
        duration: '1 hora',
        active: true,
      },
      {
        name: 'Barco de pesca',
        type: 'locacao',
        description: 'Barco para até 3 pessoas, sem motor.',
        price: 80,
        duration: '4 horas',
        active: true,
      },
    ]
    for (const rate of ratesData) ensureRecord('service_rates', 'name', rate.name, rate)

    ensureRecord('promotions', 'title', 'Quinta do pescador', {
      title: 'Quinta do pescador',
      text: 'Na compra de uma diária de pesca, ganhe 10% de desconto em uma porção de tilápia crocante.',
      promotion_date: new Date().toISOString(),
      destination: 'todos',
      active: true,
    })
  },
  (app) => {
    const seededNames = [
      'Tilápia crocante',
      'Peixe na brasa',
      'Isca de peixe',
      'Refrigerante lata',
      'Suco natural',
    ]
    for (const name of seededNames) {
      try {
        app.delete(app.findFirstRecordByData('menu_items', 'name', name))
      } catch (_) {}
    }
    const rateNames = [
      'Diária de pesca — adulto',
      'Meia diária de pesca',
      'Caiaque individual',
      'Barco de pesca',
    ]
    for (const name of rateNames) {
      try {
        app.delete(app.findFirstRecordByData('service_rates', 'name', name))
      } catch (_) {}
    }
    try {
      app.delete(app.findFirstRecordByData('promotions', 'title', 'Quinta do pescador'))
    } catch (_) {}
    try {
      app.delete(app.findFirstRecordByData('settings', 'key', 'main'))
    } catch (_) {}
    try {
      app.delete(app.findAuthRecordByEmail('_pb_users_auth_', 'ceduzzi15@gmail.com'))
    } catch (_) {}
  },
)
