// Shared translations + money formatting (Spanish is the default language)
const I18N = {
  es: {
    tagline: 'Tablas de quesos elegantes para cada ocasión',
    heroTitle: 'Arma tu tabla de quesos perfecta',
    heroText: 'Elige un tamaño, escoge tus quesos, carnes frías y acompañamientos favoritos, agrega una botella de vino y nosotros nos encargamos del resto.',
    stepSize: 'Tamaño', stepDetails: 'Tus datos', stepSummary: 'Resumen',
    next: 'Siguiente →', back: '← Atrás', skip: 'Omitir →', review: 'Revisar pedido →',
    chooseSize: 'Elige el tamaño de tu tabla',
    chooseSizeHelp: 'Cada tamaño incluye una cantidad fija de productos. ¿Quieres de todo? Elige <b>Personalizada</b> y paga por producto.',
    from: 'Desde ', noLimits: 'Sin límites — agrega lo que quieras', perItem: 'Cada producto tiene su propio precio',
    upTo: 'Hasta {n} {cat}',
    selected: '{n} seleccionados', optionalPriced: ' — opcional, con precio individual',
    ofSelected: '{n} / {max} seleccionados', limitReached: ' — límite alcanzado (elige Personalizada para más)',
    included: 'Incluido', noItems: 'No hay productos disponibles por ahora.',
    delivery: 'Domicilio', pickup: 'Recoger en tienda',
    fullName: 'Nombre completo *', phone: 'Teléfono / WhatsApp *', email: 'Correo electrónico',
    address: 'Dirección de entrega *', eventDate: 'Fecha del evento *', time: 'Hora',
    occasion: 'Ocasión (cumpleaños, matrimonio, empresarial…)', notes: 'Notas / alergias',
    errName: 'Por favor escribe tu nombre.', errPhone: 'Por favor escribe un teléfono válido.',
    errAddress: 'Por favor escribe la dirección de entrega.', errDate: 'Por favor elige la fecha del evento.',
    errEmpty: 'Por favor selecciona al menos un producto para tu tabla.',
    summaryTitle: 'Resumen del pedido', table: 'Tabla', subtotal: 'Subtotal', deliveryFee: 'Domicilio', total: 'Total',
    customer: 'Cliente', deliveryTo: 'Domicilio a', confirmHelp: 'Al confirmar se abrirá WhatsApp con tu pedido listo para enviarnos. ¡Solo presiona enviar!',
    confirm: 'Confirmar y enviar por WhatsApp', sending: 'Enviando…',
    yourTable: 'Tu tabla', chooseToStart: 'Elige un tamaño para empezar.',
    thanks: '¡Gracias, {name}!', registered: 'Tu pedido <b>{id}</b> fue registrado. Total: <b>{total}</b>',
    waFallback: 'Si WhatsApp no se abrió automáticamente, toca el botón para enviarnos tu pedido.',
    sendWa: 'Enviar pedido por WhatsApp', newOrder: 'Hacer un nuevo pedido',
    // admin
    adminSub: 'Pedidos, estadísticas y catálogo', viewStore: 'Ver tienda ↗', logout: 'Cerrar sesión',
    login: 'Ingreso administrador', password: 'Contraseña', enter: 'Ingresar',
    tabDashboard: '📊 Panel', tabOrders: '🧾 Pedidos', tabCatalog: '🧀 Catálogo', tabSettings: '⚙️ Ajustes',
    loading: 'Cargando…', noData: 'Aún no hay datos.',
    kTotal: 'Pedidos totales', kRevenue: 'Ventas (sin cancelados)', kAvg: 'Pedido promedio', kOpen: 'Pedidos por atender',
    upcoming: 'Próximos eventos', nothingScheduled: 'Nada programado.', byStatus: 'Pedidos por estado',
    revByMonth: 'Ventas por mes', ordersByMonth: 'Pedidos por mes', sizesSold: 'Tamaños vendidos', revBySize: 'Ventas por tamaño',
    topProducts: 'Top 10 productos', byWeekday: 'Eventos por día de la semana',
    weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    status_new: 'nuevo', status_confirmed: 'confirmado', status_preparing: 'en preparación', status_delivered: 'entregado', status_cancelled: 'cancelado',
    search: 'Buscar nombre, teléfono, # pedido…', allStatuses: 'Todos los estados', dateFrom: 'Fecha evento desde', dateTo: 'Fecha evento hasta',
    exportCsv: 'Exportar CSV', noMatch: 'Ningún pedido coincide.',
    thOrder: 'Pedido', thPlaced: 'Creado', thEvent: 'Fecha evento', thCustomer: 'Cliente', thTable: 'Tabla', thTotal: 'Total', thStatus: 'Estado',
    placed: 'Creado', order: 'Pedido', status: 'Estado', internalNotes: 'Notas internas', save: 'Guardar',
    waCustomer: 'WhatsApp al cliente', del: 'Eliminar', confirmDelete: '¿Eliminar el pedido {id} de forma permanente?',
    waGreeting: '¡Hola {name}! Sobre tu pedido {id}…', incl: 'incl.',
    sizes: 'Tamaños de tabla', sizesHelp: 'Los tamaños base incluyen hasta N productos por categoría por el precio base. Los tamaños "Personalizada" no tienen límite y cobran el precio de cada producto.',
    name: 'Nombre (ES)', nameEn: 'Nombre (EN)', serves: 'Porciones (ES)', servesEn: 'Porciones (EN)', basePrice: 'Precio base', max: 'Máx.',
    custom: 'Personalizada', active: 'Activo', saveSizes: 'Guardar tamaños', addSize: '+ Agregar tamaño',
    products: 'Productos', productsHelp: 'El precio se cobra en tablas Personalizadas y siempre en categorías sin límite (ej. vinos). Desmarca "Activo" para ocultar un producto sin borrarlo.',
    category: 'Categoría', price: 'Precio', saveProducts: 'Guardar productos', addProduct: '+ Agregar producto',
    confirmDelProduct: '¿Eliminar este producto? (Consejo: desmarca Activo para solo ocultarlo)',
    categories: 'Categorías', categoriesHelp: 'Las categorías "Limitadas" cuentan para los límites de cada tamaño. Las no limitadas son adicionales opcionales con costo (vinos, decoración, etc.).',
    description: 'Descripción (ES)', descriptionEn: 'Descripción (EN)', limited: 'Limitada', saveCats: 'Guardar categorías', addCat: '+ Agregar categoría',
    catPrompt: 'Nombre de la categoría (ej. "Decoración para fiestas")', catExists: 'Esa categoría ya existe',
    saved: '✓ Guardado', business: 'Datos del negocio', businessName: 'Nombre del negocio',
    waNumber: 'Número de WhatsApp que recibe los pedidos', waHelp: 'Formato internacional, solo dígitos — código de país + número, ej. 573001234567',
    currency: 'Moneda', saveSettings: 'Guardar ajustes', newSize: 'Nuevo tamaño', newProduct: 'Nuevo producto',
  },
  en: {
    tagline: 'Elegant cheese tables for every occasion',
    heroTitle: 'Build your perfect cheese table',
    heroText: "Choose a size, pick your favourite cheeses, charcuterie and accompaniments, add a bottle of wine, and we'll take care of the rest.",
    stepSize: 'Size', stepDetails: 'Your details', stepSummary: 'Summary',
    next: 'Next →', back: '← Back', skip: 'Skip →', review: 'Review order →',
    chooseSize: 'Choose your table size',
    chooseSizeHelp: 'Each size includes a set number of items. Want everything? Choose <b>Fully Custom</b> and pay per item.',
    from: 'From ', noLimits: 'No limits — add anything', perItem: 'Each item priced individually',
    upTo: 'Up to {n} {cat}',
    selected: '{n} selected', optionalPriced: ' — optional, priced individually',
    ofSelected: '{n} / {max} selected', limitReached: ' — limit reached (switch to Fully Custom for more)',
    included: 'Included', noItems: 'No items available right now.',
    delivery: 'Delivery', pickup: 'Pickup',
    fullName: 'Full name *', phone: 'Phone / WhatsApp *', email: 'Email',
    address: 'Delivery address *', eventDate: 'Event date *', time: 'Time',
    occasion: 'Occasion (birthday, wedding, corporate…)', notes: 'Notes / allergies',
    errName: 'Please enter your name.', errPhone: 'Please enter a valid phone number.',
    errAddress: 'Please enter the delivery address.', errDate: 'Please choose the event date.',
    errEmpty: 'Please select at least one item for your table.',
    summaryTitle: 'Order summary', table: 'table', subtotal: 'Subtotal', deliveryFee: 'Delivery', total: 'Total',
    customer: 'Customer', deliveryTo: 'Delivery to', confirmHelp: 'When you confirm, WhatsApp will open with your order ready to send to us. Just press send!',
    confirm: 'Confirm & send via WhatsApp', sending: 'Sending…',
    yourTable: 'Your table', chooseToStart: 'Choose a size to get started.',
    thanks: 'Thank you, {name}!', registered: 'Your order <b>{id}</b> has been registered. Total: <b>{total}</b>',
    waFallback: "If WhatsApp didn't open automatically, tap the button below to send us your order.",
    sendWa: 'Send order via WhatsApp', newOrder: 'Start a new order',
    adminSub: 'Orders, statistics and catalog', viewStore: 'View store ↗', logout: 'Log out',
    login: 'Admin login', password: 'Password', enter: 'Log in',
    tabDashboard: '📊 Dashboard', tabOrders: '🧾 Orders', tabCatalog: '🧀 Catalog', tabSettings: '⚙️ Settings',
    loading: 'Loading…', noData: 'No data yet.',
    kTotal: 'Total orders', kRevenue: 'Revenue (excl. cancelled)', kAvg: 'Average order', kOpen: 'Open orders to fulfil',
    upcoming: 'Upcoming events', nothingScheduled: 'Nothing scheduled.', byStatus: 'Orders by status',
    revByMonth: 'Revenue by month', ordersByMonth: 'Orders by month', sizesSold: 'Table sizes sold', revBySize: 'Revenue by size',
    topProducts: 'Top 10 products', byWeekday: 'Events by weekday',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    status_new: 'new', status_confirmed: 'confirmed', status_preparing: 'preparing', status_delivered: 'delivered', status_cancelled: 'cancelled',
    search: 'Search name, phone, order ID…', allStatuses: 'All statuses', dateFrom: 'Event date from', dateTo: 'Event date to',
    exportCsv: 'Export CSV', noMatch: 'No orders match.',
    thOrder: 'Order', thPlaced: 'Placed', thEvent: 'Event date', thCustomer: 'Customer', thTable: 'Table', thTotal: 'Total', thStatus: 'Status',
    placed: 'Placed', order: 'Order', status: 'Status', internalNotes: 'Internal notes', save: 'Save',
    waCustomer: 'WhatsApp customer', del: 'Delete', confirmDelete: 'Delete order {id} permanently?',
    waGreeting: 'Hi {name}! About your order {id}…', incl: 'incl.',
    sizes: 'Table sizes', sizesHelp: 'Base sizes include up to N items per category for the base price. "Custom" sizes have no limits and charge each item\'s price.',
    name: 'Name (ES)', nameEn: 'Name (EN)', serves: 'Serves (ES)', servesEn: 'Serves (EN)', basePrice: 'Base price', max: 'Max',
    custom: 'Custom', active: 'Active', saveSizes: 'Save sizes', addSize: '+ Add size',
    products: 'Products', productsHelp: 'Price is charged on Custom tables, and always for categories without limits (e.g. wines). Uncheck "Active" to hide an item without deleting it.',
    category: 'Category', price: 'Price', saveProducts: 'Save products', addProduct: '+ Add product',
    confirmDelProduct: 'Delete this product? (Tip: uncheck Active to just hide it)',
    categories: 'Categories', categoriesHelp: '"Limited" categories count against the size limits. Unlimited categories are optional paid add-ons (wines, party extras, etc.).',
    description: 'Description (ES)', descriptionEn: 'Description (EN)', limited: 'Limited', saveCats: 'Save categories', addCat: '+ Add category',
    catPrompt: 'Category name (e.g. "Party decorations")', catExists: 'That category already exists',
    saved: '✓ Saved', business: 'Business settings', businessName: 'Business name',
    waNumber: 'WhatsApp number that receives orders', waHelp: 'International format, digits only — country code + number, e.g. 573001234567',
    currency: 'Currency', saveSettings: 'Save settings', newSize: 'New size', newProduct: 'New product',
  },
};

let LANG = 'es';
try { LANG = localStorage.getItem('lang') || 'es'; } catch {}
if (!I18N[LANG]) LANG = 'es';
document.documentElement.lang = LANG;

function t(key, vars = {}) {
  const s = I18N[LANG][key] ?? I18N.es[key] ?? key;
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : s;
}

// Localized catalog field: uses `<field>En` in English when present, falls back to Spanish
const tr = (obj, field = 'name') => (LANG === 'en' && obj?.[field + 'En']) || obj?.[field] || '';

function setLang(l) {
  LANG = l;
  try { localStorage.setItem('lang', l); } catch {}
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
}

function langSwitcher() {
  return `<span class="langsw">${['es', 'en'].map(l => `<button data-lang="${l}" class="${l === LANG ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</span>`;
}

const CURRENCY_DIGITS = { COP: 0, CLP: 0, JPY: 0 };
function formatMoney(n, code = 'COP') {
  const digits = CURRENCY_DIGITS[code] ?? 2;
  try {
    return new Intl.NumberFormat(code === 'COP' ? 'es-CO' : LANG, {
      style: 'currency', currency: code, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(Number(n) || 0);
  } catch {
    return `${code} ${Number(n || 0).toLocaleString()}`;
  }
}
