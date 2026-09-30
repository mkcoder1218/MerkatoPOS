'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type Session = {
  accessToken: string;
  refreshToken: string;
};

type Me = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  branchIds: string[];
  permissions: string[];
};

type Branch = { id: string; name: string; code: string | null; isActive: boolean };

type Register = {
  id: string;
  branchId: string;
  name: string;
  code: string;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  posVisible: boolean;
  isActive: boolean;
};

type ProductBranch = {
  branchId: string;
  isAvailable: boolean;
  priceOverride: string | null;
};

type Product = {
  id: string;
  name: string;
  categoryId: string;
  sellingPrice: string;
  sku: string | null;
  barcode: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  branches: ProductBranch[];
};

type Shift = {
  id: string;
  branchId: string;
  registerId: string;
  status: 'OPEN' | 'CLOSED';
  openingCash: string;
  openedAt: string;
};

type CartItem = { product: Product; quantity: number };

type OrderResponse = {
  id: string;
  grandTotal: string;
};

function money(value: string | number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload?.message.join(', ')
      : payload?.message;
    throw new Error(message || 'Request failed (' + response.status + ')');
  }

  return response.json() as Promise<T>;
}

export function PosApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [branchId, setBranchId] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem('merkatopos.session');
    if (raw) {
      setSession(JSON.parse(raw) as Session);
    }
  }, []);

  useEffect(() => {
    if (!session?.accessToken) return;
    void loadWorkspace(session.accessToken);
  }, [session?.accessToken]);

  async function loadWorkspace(token: string) {
    setLoading(true);
    setStatus('');
    try {
      const current = await request<Me>('/auth/me', {}, token);
      setMe(current);

      const [nextBranches, nextRegisters, nextCategories, nextProducts, nextShifts] =
        await Promise.all([
          request<Branch[]>('/branches', {}, token),
          request<Register[]>('/registers', {}, token),
          request<Category[]>('/categories', {}, token),
          request<Product[]>('/products', {}, token),
          request<Shift[]>('/shifts', {}, token),
        ]);

      setBranches(nextBranches.filter((branch) => branch.isActive));
      setRegisters(nextRegisters.filter((register) => register.isActive));
      setCategories(
        nextCategories.filter((category) => category.isActive && category.posVisible),
      );
      setProducts(nextProducts.filter((product) => product.isActive));
      setShifts(nextShifts);

      const firstBranch =
        nextBranches.find(
          (branch) => branch.isActive && current.branchIds.includes(branch.id),
        )?.id ?? '';
      setBranchId((value) => value || firstBranch);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load workspace');
    } finally {
      setLoading(false);
    }
  }

  const visibleRegisters = useMemo(
    () => registers.filter((register) => register.branchId === branchId),
    [registers, branchId],
  );

  useEffect(() => {
    if (!visibleRegisters.some((register) => register.id === registerId)) {
      setRegisterId(visibleRegisters[0]?.id ?? '');
    }
  }, [visibleRegisters, registerId]);

  const activeShift = shifts.find(
    (shift) => shift.registerId === registerId && shift.status === 'OPEN',
  );

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const branch = product.branches.find((entry) => entry.branchId === branchId);
      if (!branch?.isAvailable) return false;
      if (categoryId !== 'all' && product.categoryId !== categoryId) return false;
      if (!term) return true;
      return [product.name, product.sku ?? '', product.barcode ?? ''].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [products, branchId, categoryId, search]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const branch = item.product.branches.find((entry) => entry.branchId === branchId);
        const price = Number(branch?.priceOverride ?? item.product.sellingPrice);
        return sum + price * item.quantity;
      }, 0),
    [cart, branchId],
  );

  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    const data = new FormData(event.currentTarget);
    try {
      const nextSession = await request<Session>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          tenantSlug: String(data.get('tenantSlug') ?? '').trim().toLowerCase(),
          email: String(data.get('email') ?? '').trim(),
          password: String(data.get('password') ?? ''),
        }),
      });
      window.sessionStorage.setItem(
        'merkatopos.session',
        JSON.stringify(nextSession),
      );
      setSession(nextSession);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function openShift() {
    if (!session || !branchId || !registerId) return;
    const raw = window.prompt('Opening cash amount (ETB)', '0.00');
    if (raw === null) return;

    setLoading(true);
    setStatus('');
    try {
      await request('/shifts/open', {
        method: 'POST',
        body: JSON.stringify({
          branchId,
          registerId,
          openingCash: raw,
        }),
      }, session.accessToken);
      await loadWorkspace(session.accessToken);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open shift');
    } finally {
      setLoading(false);
    }
  }

  async function checkoutCash() {
    if (!session || !branchId || !registerId || cart.length === 0) return;
    setLoading(true);
    setStatus('');

    try {
      const order = await request<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          branchId,
          registerId,
          type: 'TAKEAWAY',
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: String(item.quantity),
          })),
        }),
      }, session.accessToken);

      await request('/orders/' + order.id + '/complete', {
        method: 'POST',
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          payments: [{ method: 'CASH', amount: order.grandTotal }],
        }),
      }, session.accessToken);

      setCart([]);
      setStatus('Sale completed. Receipt and kitchen print jobs were queued.');
      await loadWorkspace(session.accessToken);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem('merkatopos.session');
    setSession(null);
    setMe(null);
    setCart([]);
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="brand-mark">M</div>
          <p className="eyebrow">MerkatoPOS</p>
          <h1>Run the counter, not the software.</h1>
          <p className="muted">
            Sign in to your business workspace to start selling.
          </p>

          <form className="login-form" onSubmit={login}>
            <label>
              Business slug
              <input name="tenantSlug" placeholder="my-business" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@business.com" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {status && <p className="status-message error">{status}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="pos-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark small">M</div>
          <div>
            <strong>MerkatoPOS</strong>
            <span>Point of sale</span>
          </div>
        </div>

        <nav className="nav-list">
          <button className="nav-item active"><span>▦</span> Sell</button>
          <button className="nav-item"><span>◫</span> Orders</button>
          <button className="nav-item"><span>◇</span> Inventory</button>
          <button className="nav-item"><span>▤</span> Reports</button>
          <button className="nav-item"><span>⚙</span> Settings</button>
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{me?.name?.slice(0, 1).toUpperCase() || 'U'}</div>
          <div>
            <strong>{me?.name ?? 'User'}</strong>
            <span>{me?.email ?? ''}</span>
          </div>
          <button className="icon-button" onClick={logout} title="Sign out">↗</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Current sale</p>
            <h2>New order</h2>
          </div>

          <div className="context-controls">
            <label className="select-control">
              <span>Branch</span>
              <select value={branchId} onChange={(event) => {
                setBranchId(event.target.value);
                setCart([]);
              }}>
                {branches
                  .filter((branch) => me?.branchIds.includes(branch.id))
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
              </select>
            </label>

            <label className="select-control">
              <span>Register</span>
              <select value={registerId} onChange={(event) => setRegisterId(event.target.value)}>
                {visibleRegisters.map((register) => (
                  <option key={register.id} value={register.id}>{register.name}</option>
                ))}
              </select>
            </label>

            <div className={'shift-pill ' + (activeShift ? 'open' : 'closed')}>
              <span className="status-dot" />
              {activeShift ? 'Shift open' : 'No active shift'}
            </div>

            {!activeShift && registerId && (
              <button className="secondary-button" onClick={openShift} disabled={loading}>
                Open shift
              </button>
            )}
          </div>
        </header>

        {status && (
          <div className={'status-banner ' + (status.startsWith('Sale completed') ? 'success' : '')}>
            {status}
          </div>
        )}

        <div className="pos-grid">
          <section className="catalog">
            <div className="catalog-toolbar">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, SKU or barcode"
                />
              </div>
              <span className="product-count">{visibleProducts.length} products</span>
            </div>

            <div className="category-tabs">
              <button
                className={categoryId === 'all' ? 'category-tab active' : 'category-tab'}
                onClick={() => setCategoryId('all')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={categoryId === category.id ? 'category-tab active' : 'category-tab'}
                  onClick={() => setCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {visibleProducts.map((product) => {
                const branch = product.branches.find((entry) => entry.branchId === branchId);
                const price = branch?.priceOverride ?? product.sellingPrice;
                return (
                  <button className="product-card" key={product.id} onClick={() => addProduct(product)}>
                    <div className="product-thumb">
                      <span>{product.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="product-copy">
                      <strong>{product.name}</strong>
                      <span>{product.category.name}</span>
                      <b>{money(price)}</b>
                    </div>
                  </button>
                );
              })}

              {!loading && visibleProducts.length === 0 && (
                <div className="empty-state">
                  <div>□</div>
                  <h3>No products here yet</h3>
                  <p>Add products or make them available for this branch.</p>
                </div>
              )}
            </div>
          </section>

          <aside className="cart-panel">
            <div className="cart-header">
              <div>
                <p className="eyebrow">Order</p>
                <h3>Cart</h3>
              </div>
              <span className="cart-count">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            <div className="cart-items">
              {cart.map((item) => {
                const branch = item.product.branches.find((entry) => entry.branchId === branchId);
                const price = Number(branch?.priceOverride ?? item.product.sellingPrice);
                return (
                  <div className="cart-line" key={item.product.id}>
                    <div className="cart-line-main">
                      <strong>{item.product.name}</strong>
                      <span>{money(price)} each</span>
                    </div>
                    <div className="qty-control">
                      <button onClick={() => updateQuantity(item.product.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                    </div>
                    <strong>{money(price * item.quantity)}</strong>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="cart-empty">
                  <div className="cart-empty-icon">＋</div>
                  <h3>Start a sale</h3>
                  <p>Tap any product to add it to the cart.</p>
                </div>
              )}
            </div>

            <div className="cart-summary">
              <div><span>Estimated subtotal</span><strong>{money(cartTotal)}</strong></div>
              <p>Final discounts and tax are recalculated securely by the server.</p>
              <div className="grand-total">
                <span>Estimated total</span>
                <strong>{money(cartTotal)}</strong>
              </div>
              <button
                className="pay-button"
                disabled={loading || !activeShift || !registerId || cart.length === 0}
                onClick={checkoutCash}
              >
                {loading ? 'Working…' : 'Pay cash'}
                <span>→</span>
              </button>
              {!activeShift && (
                <small>Open a shift before completing a sale.</small>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
