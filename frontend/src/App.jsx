import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%23f5ecff" offset="0"/><stop stop-color="%23ecebff" offset="1"/></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><g fill="none" stroke="%23b084f7" stroke-width="8" opacity="0.75"><rect x="120" y="85" width="360" height="230" rx="22"/><path d="M140 280l95-85 75 62 68-54 82 77"/></g><circle cx="248" cy="160" r="22" fill="%23c9a3ff" opacity="0.9"/><text x="300" y="355" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="%237358a8">No photo</text></svg>'

function resolveImageUrl(image) {
  if (!image) return PLACEHOLDER_IMAGE
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
    return image
  }
  if (image.startsWith('/')) {
    return `${API_BASE_URL}${image}`
  }
  return `${API_BASE_URL}/${image}`
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json()
}

function App() {
  const SCROLL_DURATION_MS = 1600
  const [view, setView] = useState('catalog')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [ages, setAges] = useState([])
  const [genders, setGenders] = useState([])
  const [prices, setPrices] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [productsInOrders, setProductsInOrders] = useState([])
  const [cart, setCart] = useState({})
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [search, setSearch] = useState('')
  const [isEnteringCatalog, setIsEnteringCatalog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [error, setError] = useState('')
  const [addedProductId, setAddedProductId] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [authForm, setAuthForm] = useState({
    login: '',
    phone: '',
    email: '',
    password: '',
    is_admin: false,
  })
  const [adminForms, setAdminForms] = useState({
    category: { name: '' },
    size: { name: '' },
    age: { name: '' },
    gender: { name: '' },
    product: {
      name: '',
      description: '',
      image: '',
      available_quantity: 0,
      category_id: '',
      age_id: '',
      gender_id: '',
      size_id: '',
    },
    price: { product_id: '', price: '' },
  })
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState('')
  const [checkoutDraftItems, setCheckoutDraftItems] = useState([])
  const catalogRef = useRef(null)

  const setAdminField = (section, field, value) => {
    setAdminForms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const loadProductsByCategory = async (categoryId) => {
    const path = categoryId === 'all'
      ? '/api/products'
      : `/api/products/category/${categoryId}`

    const productsData = await apiRequest(path)
    setProducts(productsData.products ?? [])
  }

  const loadInitialData = async () => {
    setLoading(true)
    setError('')
    try {
      const [categoriesData, productsData, cartData] = await Promise.all([
        apiRequest('/api/categories'),
        apiRequest('/api/products'),
        apiRequest('/api/cart/raw'),
      ])

      const [sizesData, agesData, gendersData, pricesData, ordersData, productsInOrdersData] = await Promise.all([
        apiRequest('/api/entities/sizes'),
        apiRequest('/api/entities/ages'),
        apiRequest('/api/entities/genders'),
        apiRequest('/api/entities/prices'),
        apiRequest('/api/entities/orders'),
        apiRequest('/api/entities/products-in-orders'),
      ])

      setCategories(categoriesData)
      setSizes(sizesData)
      setAges(agesData)
      setGenders(gendersData)
      setPrices(pricesData)
      setOrders(ordersData)
      setProductsInOrders(productsInOrdersData)
      setProducts(productsData.products ?? [])
      setCart(cartData.cart ?? {})
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadInitialData()
    }, 0)

    return () => clearTimeout(timerId)
  }, [])

  useEffect(() => {
    const loadByCategory = async () => {
      setLoading(true)
      setError('')
      try {
        await loadProductsByCategory(selectedCategoryId)
      } catch (err) {
        setError(err.message || 'Не удалось загрузить товары по категории')
      } finally {
        setLoading(false)
      }
    }

    loadByCategory()
  }, [selectedCategoryId])

  const cartCount = useMemo(() => {
    if (cart && typeof cart === 'object') {
      return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0)
    }

    return 0
  }, [cart])

  const categoriesMap = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.id, item.name])),
    [categories],
  )
  const sizesMap = useMemo(
    () => Object.fromEntries(sizes.map((item) => [item.id, item.name])),
    [sizes],
  )
  const agesMap = useMemo(
    () => Object.fromEntries(ages.map((item) => [item.id, item.name])),
    [ages],
  )
  const gendersMap = useMemo(
    () => Object.fromEntries(genders.map((item) => [item.id, item.name])),
    [genders],
  )

  const priceMap = useMemo(() => {
    const grouped = {}
    for (const row of prices) {
      if (!grouped[row.product_id] || new Date(row.created_at) > new Date(grouped[row.product_id].created_at)) {
        grouped[row.product_id] = row
      }
    }
    const result = {}
    for (const [productId, row] of Object.entries(grouped)) {
      result[Number(productId)] = Number(row.price || 0)
    }
    return result
  }, [prices])

  const addToCart = async (productId) => {
    setError('')
    setCartLoading(true)
    try {
      const data = await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })
      setCart(data.cart ?? {})
      setAddedProductId(productId)
    } catch (err) {
      setError(err.message || 'Не удалось добавить товар в корзину')
    } finally {
      setCartLoading(false)
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    try {
      if (authMode === 'register') {
        const data = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(authForm),
        })
        setCurrentUser(data.user ?? null)
        setView('catalog')
      } else {
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
          }),
        })
        setCurrentUser(data.user ?? null)
        setView('catalog')
      }
    } catch (err) {
      setError(err.message || 'Ошибка авторизации')
    } finally {
      setAuthLoading(false)
    }
  }

  const updateQuantity = async (productId, nextQuantity) => {
    setError('')
    setCartLoading(true)

    try {
      if (nextQuantity <= 0) {
        const data = await apiRequest(`/api/cart/remove/${productId}`, {
          method: 'DELETE',
        })
        setCart(data.cart ?? {})
        return
      }

      const data = await apiRequest('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ product_id: productId, quantity: nextQuantity }),
      })
      setCart(data.cart ?? {})
    } catch (err) {
      setError(err.message || 'Не удалось обновить корзину')
    } finally {
      setCartLoading(false)
    }
  }

  const createEntity = async (entity, payload) => {
    setError('')
    setAdminMessage('')
    setAdminLoading(true)
    try {
      await apiRequest(`/api/entities/${entity}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAdminMessage(`Создано: ${entity}`)
      await loadInitialData()
    } catch (err) {
      setError(err.message || `Не удалось создать ${entity}`)
    } finally {
      setAdminLoading(false)
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    const payload = {
      ...adminForms.product,
      available_quantity: Number(adminForms.product.available_quantity),
      category_id: Number(adminForms.product.category_id),
      age_id: Number(adminForms.product.age_id),
      gender_id: Number(adminForms.product.gender_id),
      size_id: Number(adminForms.product.size_id),
    }
    await createEntity('products', payload)
  }

  const createPrice = async (e) => {
    e.preventDefault()
    const payload = {
      product_id: Number(adminForms.price.product_id),
      price: Number(adminForms.price.price),
    }
    await createEntity('prices', payload)
  }

  const openCheckoutPage = () => {
    if (cartItems.length === 0) return
    setCheckoutSuccess('')
    setCheckoutDraftItems(
      cartItems.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        price: priceMap[item.product.id] || 0,
        quantity: item.quantity,
      })),
    )
    setView('checkout')
  }

  const updateCheckoutItemQty = (productId, quantity) => {
    setCheckoutDraftItems((prev) => prev
      .map((item) => (item.product_id === productId ? { ...item, quantity: Math.max(1, Number(quantity || 1)) } : item)))
  }

  const checkoutTotalDraft = checkoutDraftItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  )

  const submitCheckoutOrder = async () => {
    if (checkoutDraftItems.length === 0) return
    setError('')
    setCheckoutSuccess('')
    setCheckoutLoading(true)
    try {
      const order = await apiRequest('/api/entities/orders', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      await Promise.all(checkoutDraftItems.map((item) => apiRequest('/api/entities/products-in-orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: item.product_id,
          order_id: order.id,
          total_products_in_order: item.quantity,
          total_order_amount: Number(item.price || 0) * Number(item.quantity || 0),
        }),
      })))

      await Promise.all(checkoutDraftItems.map((item) => apiRequest(`/api/cart/remove/${item.product_id}`, {
        method: 'DELETE',
      })))

      setCart({})
      setCheckoutDraftItems([])
      setCheckoutSuccess(`Заказ #${order.id} успешно оформлен`)
      setView('checkout')
    } catch (err) {
      setError(err.message || 'Не удалось оформить заказ')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const deleteProduct = async (productId) => {
    if (!productId) return
    setError('')
    setAdminMessage('')
    setAdminLoading(true)
    try {
      await apiRequest(`/api/entities/products/${productId}`, {
        method: 'DELETE',
      })
      setAdminMessage(`Товар #${productId} удалён`)
      setAdminForms((prev) => ({
        ...prev,
        price: {
          ...prev.price,
          product_id: prev.price.product_id === String(productId) ? '' : prev.price.product_id,
        },
      }))
      await loadInitialData()
    } catch (err) {
      setError(err.message || 'Не удалось удалить товар')
    } finally {
      setAdminLoading(false)
    }
  }

  const deleteOrder = async (orderId) => {
    setError('')
    setAdminMessage('')
    setAdminLoading(true)
    try {
      const linkedRows = productsInOrders.filter((row) => row.order_id === orderId)
      await Promise.all(linkedRows.map((row) => apiRequest(`/api/entities/products-in-orders/${row.id}`, {
        method: 'DELETE',
      })))
      await apiRequest(`/api/entities/orders/${orderId}`, {
        method: 'DELETE',
      })
      setAdminMessage(`Заказ #${orderId} удалён`)
      await loadInitialData()
    } catch (err) {
      setError(err.message || 'Не удалось удалить заказ')
    } finally {
      setAdminLoading(false)
    }
  }

  const ordersWithItems = useMemo(() => orders
    .map((order) => {
      const items = productsInOrders
        .filter((row) => row.order_id === order.id)
        .map((row) => {
          const product = products.find((p) => p.id === row.product_id)
          return {
            ...row,
            product_name: product?.name ?? `Товар #${row.product_id}`,
          }
        })
      const total = items.reduce((sum, row) => sum + Number(row.total_order_amount || 0), 0)
      return { ...order, items, total }
    })
    .sort((a, b) => b.id - a.id), [orders, productsInOrders, products])

  const cartItems = useMemo(() => {
    if (!cart || typeof cart !== 'object') return []

    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === Number(productId))
        if (!product) return null
        return {
          product,
          quantity: Number(quantity || 0),
        }
      })
      .filter(Boolean)
  }, [cart, products])

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * (priceMap[item.product.id] || 0), 0),
    [cartItems, priceMap],
  )

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId],
  )

  useEffect(() => {
    if (addedProductId == null) return
    const timer = setTimeout(() => setAddedProductId(null), 1400)
    return () => clearTimeout(timer)
  }, [addedProductId])

  const animatePageScroll = (targetY) => {
    setIsEnteringCatalog(true)

    const startY = window.scrollY
    const distance = targetY - startY
    const startTime = performance.now()

    const easeInOutCubic = (t) => (t < 0.5
      ? 4 * t * t * t
      : 1 - ((-2 * t + 2) ** 3) / 2)

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
      const eased = easeInOutCubic(progress)

      window.scrollTo(0, startY + distance * eased)

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      } else {
        setIsEnteringCatalog(false)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  const scrollToCatalog = () => {
    const targetEl = catalogRef.current
    if (!targetEl) return
    const targetY = targetEl.getBoundingClientRect().top + window.scrollY
    animatePageScroll(targetY)
  }

  return (
    <main className={`app ${isEnteringCatalog ? 'is-scrolling' : ''}`}>
      <header className="app-header">
        <button
          type="button"
          className="brand-home"
          onClick={() => {
            const isAlreadyAtTop = window.scrollY <= 8
            const isOnStartCatalogScreen = view === 'catalog' && selectedProductId === null

            if (isAlreadyAtTop && isOnStartCatalogScreen) {
              return
            }

            if (view === 'cart') {
              setView('catalog')
              setSelectedProductId(null)
              window.scrollTo(0, 0)
              return
            }

            if (view === 'auth') {
              setView('catalog')
              setSelectedProductId(null)
              window.scrollTo(0, 0)
              return
            }

            setView('catalog')
            setSelectedProductId(null)
            animatePageScroll(0)
          }}
        >
          <h1>Shop Frontend</h1>
        </button>
        <button
          type="button"
          className="cart-badge"
          onClick={() => setView('auth')}
        >
          {currentUser ? 'Профиль' : 'Войти'}
        </button>
        {currentUser?.is_admin && (
          <button
            type="button"
            className="cart-badge"
            onClick={() => setView('admin')}
          >
            Админка
          </button>
        )}
      </header>

      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}

      {view === 'auth' && (
        <section className="cart-preview auth-page">
          <button type="button" className="link-btn cart-back-btn" onClick={() => setView('catalog')}>
            ← Назад к каталогу
          </button>

          <h2 className="cart-title">{currentUser ? 'Профиль' : 'Авторизация'}</h2>

          {currentUser ? (
            <div className="profile-card">
              <div className="profile-top">
                <div className="profile-avatar" aria-hidden="true">
                  {String(currentUser.login || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="profile-kicker">Личный кабинет</p>
                  <h3 className="profile-name">{currentUser.login}</h3>
                </div>
              </div>

              <div className="profile-grid">
                <p><strong>Логин:</strong> {currentUser.login}</p>
                <p><strong>Телефон:</strong> {currentUser.phone}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Статус:</strong> Активный</p>
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-logout-btn"
                  onClick={() => {
                    setCurrentUser(null)
                    setAuthMode('login')
                  }}
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="toolbar mvp-toolbar auth-form-shell">
              <div className="toolbar-head">
                <h3>{authMode === 'register' ? 'Регистрация' : 'Вход'}</h3>
              </div>
              <div className="toolbar-controls auth-controls" style={{ gridTemplateColumns: '1fr' }}>
                {authMode === 'register' && (
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Логин"
                    value={authForm.login}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, login: e.target.value }))}
                    required
                  />
                )}
                {authMode === 'register' && (
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Телефон"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                )}
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Пароль"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
                {authMode === 'register' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={authForm.is_admin}
                      onChange={(e) => setAuthForm((prev) => ({ ...prev, is_admin: e.target.checked }))}
                    />
                    Зарегистрировать как администратора
                  </label>
                )}
                <button className="auth-action-btn" type="submit" disabled={authLoading}>
                  {authMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <button
                  className="auth-switch-btn"
                  type="button"
                  onClick={() => setAuthMode((prev) => (prev === 'register' ? 'login' : 'register'))}
                >
                  {authMode === 'register' ? 'У меня уже есть аккаунт' : 'Создать аккаунт'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {view === 'admin' && currentUser?.is_admin && (
        <section className="cart-preview auth-page">
          <button type="button" className="link-btn cart-back-btn" onClick={() => setView('catalog')}>
            ← Назад к каталогу
          </button>
          <h2 className="cart-title">Админка</h2>
          {adminMessage && <p>{adminMessage}</p>}

          <div className="toolbar mvp-toolbar" style={{ marginBottom: 16 }}>
            <div className="toolbar-head"><h3>Справочники</h3></div>
            <div className="toolbar-controls" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
              <input placeholder="Новая категория" value={adminForms.category.name} onChange={(e) => setAdminField('category', 'name', e.target.value)} />
              <button type="button" disabled={adminLoading} onClick={() => createEntity('categories', adminForms.category)}>Создать категорию</button>
              <input placeholder="Новый размер" value={adminForms.size.name} onChange={(e) => setAdminField('size', 'name', e.target.value)} />
              <button type="button" disabled={adminLoading} onClick={() => createEntity('sizes', adminForms.size)}>Создать размер</button>
              <input placeholder="Новый возраст" value={adminForms.age.name} onChange={(e) => setAdminField('age', 'name', e.target.value)} />
              <button type="button" disabled={adminLoading} onClick={() => createEntity('ages', adminForms.age)}>Создать возраст</button>
              <input placeholder="Новый пол" value={adminForms.gender.name} onChange={(e) => setAdminField('gender', 'name', e.target.value)} />
              <button type="button" disabled={adminLoading} onClick={() => createEntity('genders', adminForms.gender)}>Создать пол</button>
            </div>
          </div>

          <form className="toolbar mvp-toolbar" onSubmit={createProduct} style={{ marginBottom: 16 }}>
            <div className="toolbar-head"><h3>Создать товар</h3></div>
            <div className="toolbar-controls" style={{ gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))' }}>
              <input required placeholder="Название" value={adminForms.product.name} onChange={(e) => setAdminField('product', 'name', e.target.value)} />
              <input placeholder="Описание" value={adminForms.product.description} onChange={(e) => setAdminField('product', 'description', e.target.value)} />
              <input placeholder="URL картинки" value={adminForms.product.image} onChange={(e) => setAdminField('product', 'image', e.target.value)} />
              <input required type="number" min="0" placeholder="Остаток" value={adminForms.product.available_quantity} onChange={(e) => setAdminField('product', 'available_quantity', e.target.value)} />
              <select required value={adminForms.product.category_id} onChange={(e) => setAdminField('product', 'category_id', e.target.value)}><option value="">Категория</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select required value={adminForms.product.size_id} onChange={(e) => setAdminField('product', 'size_id', e.target.value)}><option value="">Размер</option>{sizes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select required value={adminForms.product.age_id} onChange={(e) => setAdminField('product', 'age_id', e.target.value)}><option value="">Возраст</option>{ages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select required value={adminForms.product.gender_id} onChange={(e) => setAdminField('product', 'gender_id', e.target.value)}><option value="">Пол</option>{genders.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <button type="submit" disabled={adminLoading}>Создать товар</button>
            </div>
          </form>

          <form className="toolbar mvp-toolbar" onSubmit={createPrice}>
            <div className="toolbar-head"><h3>Назначить цену</h3></div>
            <div className="toolbar-controls" style={{ gridTemplateColumns: 'minmax(220px, 1fr) minmax(180px, 220px) 200px' }}>
              <select required value={adminForms.price.product_id} onChange={(e) => setAdminField('price', 'product_id', e.target.value)}>
                <option value="">Товар</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
              </select>
              <input required type="number" min="0.01" step="0.01" placeholder="Цена" value={adminForms.price.price} onChange={(e) => setAdminField('price', 'price', e.target.value)} />
              <button type="submit" disabled={adminLoading}>Создать цену</button>
            </div>
          </form>

          <div className="toolbar mvp-toolbar" style={{ marginTop: 16 }}>
            <div className="toolbar-head"><h3>Удалить товар</h3></div>
            <div className="toolbar-controls" style={{ gridTemplateColumns: 'minmax(220px, 1fr) 220px' }}>
              <select
                defaultValue=""
                onChange={(e) => {
                  const selected = e.target.value
                  if (!selected) return
                  deleteProduct(Number(selected))
                  e.target.value = ''
                }}
                disabled={adminLoading}
              >
                <option value="">Выберите товар для удаления</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
              </select>
              <p style={{ margin: 0, alignSelf: 'center' }}>Удаление выполняется сразу после выбора</p>
            </div>
          </div>

          <div className="toolbar mvp-toolbar" style={{ marginTop: 16 }}>
            <div className="toolbar-head"><h3>Заказы пользователей</h3></div>
            {ordersWithItems.length === 0 ? (
              <p>Пока нет оформленных заказов.</p>
            ) : (
              <div className="cart-items">
                {ordersWithItems.map((order) => (
                  <div className="cart-item" key={order.id}>
                    <div className="cart-main">
                      <strong>Заказ #{order.id}</strong>
                      <p>Создан: {new Date(order.created_at).toLocaleString('ru-RU')}</p>
                      {order.items.length === 0 ? (
                        <p>Позиции заказа отсутствуют</p>
                      ) : (
                        order.items.map((item) => (
                          <p key={item.id}>
                            {item.product_name} × {item.total_products_in_order} = {Number(item.total_order_amount).toFixed(2)} ₽
                          </p>
                        ))
                      )}
                      <p><strong>Сумма заказа: {order.total.toFixed(2)} ₽</strong></p>
                    </div>
                    <div className="qty-actions">
                      <button type="button" disabled={adminLoading} onClick={() => deleteOrder(order.id)}>
                        Удалить заказ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      )}

      {view === 'checkout' && (
        <section className="cart-preview">
          <button type="button" className="link-btn cart-back-btn" onClick={() => setView('cart')}>
            ← Назад в корзину
          </button>
          <h2 className="cart-title">Оформление заказа</h2>
          {checkoutDraftItems.length > 0 && (
            <div className="cart-items">
              {checkoutDraftItems.map((item) => (
                <div className="cart-item" key={item.product_id}>
                  <div className="cart-main">
                    <strong>{item.name}</strong>
                    <p>{item.price.toFixed(2)} ₽ / шт.</p>
                    <p>Сумма позиции: {(item.price * item.quantity).toFixed(2)} ₽</p>
                  </div>
                  <div className="qty-actions">
                    <button type="button" onClick={() => updateCheckoutItemQty(item.product_id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCheckoutItemQty(item.product_id, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {checkoutDraftItems.length > 0 && (
            <div className="cart-summary">
              <p className="price big">Итого к оформлению: {checkoutTotalDraft.toFixed(2)} ₽</p>
              <button type="button" onClick={submitCheckoutOrder} disabled={checkoutLoading}>
                {checkoutLoading ? 'Оформляем...' : 'Подтвердить и оформить'}
              </button>
            </div>
          )}
          {checkoutSuccess ? (
            <p>{checkoutSuccess}</p>
          ) : (
            <p>Проверьте состав заказа и подтвердите оформление.</p>
          )}
        </section>
      )}

      {view === 'admin' && !currentUser?.is_admin && (
        <section className="cart-preview">
          <button type="button" className="link-btn cart-back-btn" onClick={() => setView('catalog')}>
            ← Назад к каталогу
          </button>
          <h2 className="cart-title">Доступ запрещён</h2>
          <p>Админка доступна только пользователям с ролью администратора.</p>
        </section>
      )}

      {view === 'catalog' && !selectedProduct && (
        <>
          <section className="hero-intro">
            <p className="brand-line">NEW ERA MARKET</p>
            <h2>Shop Frontend</h2>
            <p>New era market, быстрый просмотр и удобная корзина — всё в одном flow.</p>
            <button type="button" onClick={scrollToCatalog}>Смотреть каталог ↓</button>
          </section>

          <section ref={catalogRef} className={`catalog-shell ${isEnteringCatalog ? 'entering' : ''}`}>
            <section className="toolbar mvp-toolbar">
              <div className="toolbar-head">
                <h3>Фильтры</h3>
                <div className="toolbar-chips">
                  <span>{products.length} товаров</span>
                  <span>{categories.length} категорий</span>
                </div>
              </div>

              <div className="toolbar-controls">
                <label htmlFor="category">Категория</label>
                <select
                  id="category"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="all">Все</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Поиск по названию"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => loadProductsByCategory(selectedCategoryId)}
                >
                  Обновить
                </button>
              </div>
            </section>

            <section className="products-grid">
              {products.map((product) => (
                <article
                  className="product-card clickable"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedProductId(product.id)
                    setView('catalog')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedProductId(product.id)
                      setView('catalog')
                    }
                  }}
                >
                  <img
                    className="product-image"
                    src={resolveImageUrl(product.image)}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE
                    }}
                  />
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Без описания'}</p>
                  <p>Категория: {categoriesMap[product.category_id] ?? '—'}</p>
                  <p>Размер: {sizesMap[product.size_id] ?? '—'}</p>
                  <p className="price">{(priceMap[product.id] ?? 0).toFixed(2)} ₽</p>
                  <div className="card-actions">
                    <div className="add-to-cart-wrap">
                      {addedProductId === product.id && <div className="inline-toast">Добавлено в корзину</div>}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(product.id)
                        }}
                        disabled={cartLoading}
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {!loading && products.length === 0 && <p>Товары не найдены для выбранной категории.</p>}
          </section>
        </>
      )}

      {view === 'catalog' && selectedProduct && (
        <>
          <section className="product-details shop-style">
            <button type="button" className="link-btn" onClick={() => setSelectedProductId(null)}>
              ← Назад в каталог
            </button>
            <div className="details-layout">
              <div className="gallery-block">
                <img
                  className="details-image"
                  src={resolveImageUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
              <div>
                <p className="brand-line">LOCAL SHOP DROP</p>
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.description || 'Описание отсутствует'}</p>

                <div className="meta-grid">
                  <div><span>Категория</span><strong>{categoriesMap[selectedProduct.category_id] ?? '—'}</strong></div>
                  <div><span>Размер</span><strong>{sizesMap[selectedProduct.size_id] ?? '—'}</strong></div>
                  <div><span>Возраст</span><strong>{agesMap[selectedProduct.age_id] ?? '—'}</strong></div>
                  <div><span>Пол</span><strong>{gendersMap[selectedProduct.gender_id] ?? '—'}</strong></div>
                </div>

                <ul className="details-list">
                  <li>Остаток на складе: {selectedProduct.available_quantity}</li>
                  <li>SKU: #{selectedProduct.id}</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="sticky-buy-bar">
            <div>
              <p className="muted">Цена</p>
              <p className="price big">{(priceMap[selectedProduct.id] ?? 0).toFixed(2)} ₽</p>
            </div>
            <div className="add-to-cart-wrap">
              {addedProductId === selectedProduct.id && <div className="inline-toast">Добавлено в корзину</div>}
              <button type="button" onClick={() => addToCart(selectedProduct.id)} disabled={cartLoading}>
                Добавить в корзину
              </button>
            </div>
          </div>
        </>
      )}

      {view === 'cart' && (
        <section className="cart-preview">
          <button type="button" className="link-btn cart-back-btn" onClick={() => setView('catalog')}>
            ← Назад к покупкам
          </button>
          <h2 className="cart-title">Корзина</h2>
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <p className="cart-empty-title">Корзина пока пустая</p>
              <p className="cart-empty-subtitle">Добавь товары из каталога — они появятся здесь.</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(({ product, quantity }) => (
                  <div className="cart-item" key={product.id}>
                    <img className="cart-thumb" src={resolveImageUrl(product.image)} alt={product.name} />
                    <div className="cart-main">
                      <strong>{product.name}</strong>
                      <p>
                        {categoriesMap[product.category_id] ?? '—'} • {sizesMap[product.size_id] ?? '—'}
                      </p>
                      <p>
                        {(priceMap[product.id] ?? 0).toFixed(2)} ₽ × {quantity} = {(
                          (priceMap[product.id] ?? 0) * quantity
                        ).toFixed(2)} ₽
                      </p>
                    </div>
                    <div className="qty-actions">
                      <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)}>-</button>
                      <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                      <button type="button" onClick={() => updateQuantity(product.id, 0)}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <p>Товаров: {cartCount}</p>
                <p className="price big">Итого: {cartTotal.toFixed(2)} ₽</p>
                <button type="button" onClick={openCheckoutPage} disabled={cartItems.length === 0}>
                  К оформлению
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {view !== 'cart' && view !== 'auth' && view !== 'admin' && (
        <button
          type="button"
          className="floating-cart-btn"
          onClick={() => setView('cart')}
        >
          Корзина: {cartCount}
        </button>
      )}
    </main>
  )
}

export default App
