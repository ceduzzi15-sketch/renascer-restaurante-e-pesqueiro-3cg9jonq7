migrate(
  (app) => {
    // Guarda textos e imagens editáveis da landing page (documento único).
    const collection = new Collection({
      name: 'site_content',
      type: 'base',
      // Leitura pública (a landing é aberta a visitantes); edição só gestor/atendimento.
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      updateRule: "@request.auth.role = 'gestor' || @request.auth.role = 'atendimento'",
      deleteRule: "@request.auth.role = 'gestor'",
      fields: [
        // Hero (capa)
        { name: 'hero_badge', type: 'text', max: 120 },
        { name: 'hero_title', type: 'text', max: 200 },
        { name: 'hero_subtitle', type: 'text', max: 400 },
        { name: 'hero_cta_primary', type: 'text', max: 80 },
        { name: 'hero_cta_secondary', type: 'text', max: 80 },
        {
          name: 'cover_image',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        // Faixa de destaques sob a capa
        { name: 'strip_1_title', type: 'text', max: 80 },
        { name: 'strip_1_text', type: 'text', max: 120 },
        { name: 'strip_2_title', type: 'text', max: 80 },
        { name: 'strip_2_text', type: 'text', max: 120 },
        { name: 'strip_3_title', type: 'text', max: 80 },
        { name: 'strip_3_text', type: 'text', max: 120 },
        // Seção Experiência
        { name: 'about_eyebrow', type: 'text', max: 80 },
        { name: 'about_title', type: 'text', max: 200 },
        { name: 'about_text', type: 'text', max: 600 },
        { name: 'about_quote', type: 'text', max: 200 },
        {
          name: 'about_image_1',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        {
          name: 'about_image_2',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'feature_1_title', type: 'text', max: 80 },
        { name: 'feature_1_text', type: 'text', max: 200 },
        { name: 'feature_2_title', type: 'text', max: 80 },
        { name: 'feature_2_text', type: 'text', max: 200 },
        // Seção Cardápio (cartaz)
        { name: 'menu_tagline', type: 'text', max: 80 },
        { name: 'menu_description', type: 'text', max: 400 },
        { name: 'menu_cta', type: 'text', max: 120 },
        // Seção Galeria
        { name: 'gallery_eyebrow', type: 'text', max: 80 },
        { name: 'gallery_title', type: 'text', max: 120 },
        { name: 'gallery_text', type: 'text', max: 300 },
        {
          name: 'gallery_background',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        // Seção Promoções
        { name: 'promo_eyebrow', type: 'text', max: 80 },
        { name: 'promo_fallback_title', type: 'text', max: 120 },
        { name: 'promo_fallback_text', type: 'text', max: 300 },
        {
          name: 'promo_image',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        // Seção Localização
        { name: 'location_eyebrow', type: 'text', max: 80 },
        { name: 'location_title', type: 'text', max: 200 },
        { name: 'contact_phone', type: 'text', max: 40 },
        { name: 'opening_hours', type: 'text', max: 120 },
        { name: 'map_query', type: 'text', max: 200 },
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
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('site_content')
    app.delete(collection)
  },
)
