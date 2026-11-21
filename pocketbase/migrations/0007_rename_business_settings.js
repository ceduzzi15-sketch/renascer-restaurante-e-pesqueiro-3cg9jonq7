// Atualiza o nome do estabelecimento no registro de configurações principal,
// trocando o nome antigo "Recanto do Pescador" por "Renascer Restaurante e Pesqueiro".
// Idempotente: só altera registros que ainda contêm o nome antigo.
migrate(
  (app) => {
    const records = app.findRecordsByFilter(
      'settings',
      "business_name ~ 'Recanto do Pescador'",
      '-created',
      50,
      0,
    )
    for (const record of records) {
      record.set('business_name', 'Renascer Restaurante e Pesqueiro')
      app.save(record)
    }
  },
  (app) => {
    const records = app.findRecordsByFilter(
      'settings',
      "business_name ~ 'Renascer Restaurante e Pesqueiro'",
      '-created',
      50,
      0,
    )
    for (const record of records) {
      record.set('business_name', 'Recanto do Pescador')
      app.save(record)
    }
  },
)
