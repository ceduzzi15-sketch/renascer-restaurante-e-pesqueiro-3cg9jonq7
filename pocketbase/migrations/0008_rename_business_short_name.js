// Encurta o nome do estabelecimento no registro de configurações principal:
// de "Renascer Restaurante e Pesqueiro" para apenas "Renascer".
// Idempotente: só altera registros que ainda contêm o nome completo.
migrate(
  (app) => {
    const records = app.findRecordsByFilter(
      'settings',
      "business_name ~ 'Renascer Restaurante e Pesqueiro'",
      '-created',
      50,
      0,
    )
    for (const record of records) {
      record.set('business_name', 'Renascer')
      app.save(record)
    }
  },
  (app) => {
    const records = app.findRecordsByFilter(
      'settings',
      "business_name ~ 'Renascer'",
      '-created',
      50,
      0,
    )
    for (const record of records) {
      record.set('business_name', 'Renascer Restaurante e Pesqueiro')
      app.save(record)
    }
  },
)
