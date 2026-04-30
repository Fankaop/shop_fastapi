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
  const [authForm, setAuthForm] = useState({
    login: '',
    phone: '',
    email: '',
    password: '',
  })
  const catalogRef = useRef(null)

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

      const [sizesData, agesData, gendersData, pricesData] = await Promise.all([
        apiRequest('/api/entities/sizes'),
        apiRequest('/api/entities/ages'),
        apiRequest('/api/entities/genders'),
        apiRequest('/api/entities/prices'),
      ])

      setCategories(categoriesData)
      setSizes(sizesData)
      setAges(agesData)
      setGenders(gendersData)
      setPrices(pricesData)
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
            <div className="cart-empty-state">
              <p><strong>Логин:</strong> {currentUser.login}</p>
              <p><strong>Телефон:</strong> {currentUser.phone}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null)
                  setAuthMode('login')
                }}
              >
                Выйти
              </button>
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
              </div>
            </>
          )}
        </section>
      )}

      {view !== 'cart' && view !== 'auth' && (
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
