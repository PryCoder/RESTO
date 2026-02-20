import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrdersPage = ({ 
  orders, 
  setOrders, 
  dishes, 
  setDishes,
  mergeOrders,
  restaurantId 
}) => {
  const [billDrawerOpen, setBillDrawerOpen] = useState(false);
  const [selectedBillTable, setSelectedBillTable] = useState('');
  const [showAddDish, setShowAddDish] = useState(false);
  const [addDishForm, setAddDishForm] = useState({ 
    name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '' 
  });
  const [galleryModalDish, setGalleryModalDish] = useState(null);
  const [galleryOrderQty, setGalleryOrderQty] = useState('');
  const [galleryOrderMods, setGalleryOrderMods] = useState('');
  const [galleryOrderSuccess, setGalleryOrderSuccess] = useState(false);
  const [galleryOrderError, setGalleryOrderError] = useState('');
  const [galleryOrderTableNo, setGalleryOrderTableNo] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dishLoading, setDishLoading] = useState(false);
  const [dishError, setDishError] = useState('');
  const VITE_API_URL =  import.meta.env.VITE_API_URL;
  // Fetch orders and dishes
  useEffect(() => {
    fetchOrders();
    fetchDishes();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${VITE_API_URL}/api/orders`, { headers });
      setOrders(prev => mergeOrders(prev, res.data));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDishes = async (search = '') => {
    setDishLoading(true);
    setDishError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `${VITE_API_URL}/api/orders/dishes${search ? `?search=${encodeURIComponent(search)}` : ''}`,
        { headers }
      );
      setDishes(res.data);
    } catch (err) {
      setDishError('Could not load dishes');
    } finally {
      setDishLoading(false);
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    setDishLoading(true);
    setDishError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...addDishForm,
        ingredients: addDishForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        dietary: addDishForm.dietary.split(',').map(i => i.trim()).filter(Boolean),
        price: parseFloat(addDishForm.price)
      };
      await axios.post(`${VITE_API_URL}/api/orders/dishes`, payload, { headers });
      setShowAddDish(false);
      setAddDishForm({ name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '' });
      fetchDishes();
    } catch (err) {
      setDishError('Failed to add dish');
    } finally {
      setDishLoading(false);
    }
  };

  const handleGalleryOrder = async (e) => {
    e.preventDefault();
    setGalleryOrderError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        table: galleryOrderTableNo,
        items: [
          {
            dish: galleryModalDish._id,
            name: galleryModalDish.name,
            quantity: galleryOrderQty,
            price: galleryModalDish.price,
            modifications: galleryOrderMods ? galleryOrderMods.split(',').map(m => m.trim()).filter(Boolean) : []
          }
        ]
      };
      await axios.post(`${VITE_API_URL}/api/orders/create`, payload, { headers });
      setGalleryOrderSuccess(true);
      setGalleryOrderQty('');
      setGalleryOrderMods('');
      setGalleryOrderTableNo('');
      fetchOrders();
      setTimeout(() => {
        setGalleryOrderSuccess(false);
        setGalleryModalDish(null);
      }, 900);
    } catch (err) {
      setGalleryOrderError('Failed to place order');
    }
  };

  const handlePayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${VITE_API_URL}/api/orders/${orderId}`, { status: 'paid' }, { headers });
      fetchOrders();
      setSelectedBillTable('');
    } catch (err) {
      console.error('Failed to process payment:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px 0', position: 'relative' }}>
      {/* Orders page content - same as original but extracted */}
      {/* Bill Drawer Button */}
      <button
        style={{
          position: 'fixed',
          top: 32,
          right: 32,
          zIndex: 1202,
          background: 'linear-gradient(90deg,#6366f1,#f472b6)',
          color: '#fff',
          border: 'none',
          borderRadius: 18,
          padding: '12px 28px',
          fontFamily: 'Sora, sans-serif',
          fontWeight: 700,
          fontSize: '1.08rem',
          boxShadow: '0 2px 18px #6366f122',
          cursor: 'pointer',
        }}
        onClick={() => setBillDrawerOpen(true)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8,verticalAlign:'middle'}}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 7h14"/><path d="M9 11h6"/><path d="M9 15h6"/><path d="M5 21l2-2 2 2 2-2 2 2 2-2 2 2"/></svg>
        Bill
      </button>

      {/* Dish Gallery */}
      <button className="orders-add-dish-btn" onClick={() => setShowAddDish(true)}>Add Dish</button>
      <div className="orders-gallery">
        {dishes.map(dish => (
          <div key={dish._id} className="orders-gallery-img-wrap" onClick={()=>setGalleryModalDish(dish)}>
            <img className="orders-gallery-img" src={dish.image || '/images/chef3.png'} alt={dish.name} />
            <div className="orders-gallery-info-overlay">
              <div className="orders-gallery-name">{dish.name}</div>
              <div className="orders-gallery-desc">{dish.description}</div>
              <div className="orders-gallery-price">₹ {dish.price}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Dish Modal */}
      {showAddDish && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleAddDish}>
              <h2>Add New Dish</h2>
              <input type="text" placeholder="Name" value={addDishForm.name} onChange={e => setAddDishForm({...addDishForm, name: e.target.value})} required />
              <input type="text" placeholder="Description" value={addDishForm.description} onChange={e => setAddDishForm({...addDishForm, description: e.target.value})} />
              <input type="text" placeholder="Ingredients (comma-separated)" value={addDishForm.ingredients} onChange={e => setAddDishForm({...addDishForm, ingredients: e.target.value})} />
              <input type="number" placeholder="Price" value={addDishForm.price} onChange={e => setAddDishForm({...addDishForm, price: e.target.value})} required />
              <input type="text" placeholder="Image URL" value={addDishForm.image} onChange={e => setAddDishForm({...addDishForm, image: e.target.value})} />
              <input type="text" placeholder="Category" value={addDishForm.category} onChange={e => setAddDishForm({...addDishForm, category: e.target.value})} />
              <input type="text" placeholder="Dietary (e.g., vegan, gluten-free)" value={addDishForm.dietary} onChange={e => setAddDishForm({...addDishForm, dietary: e.target.value})} />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddDish(false)}>Cancel</button>
                <button type="submit" disabled={dishLoading}>{dishLoading ? 'Adding...' : 'Add Dish'}</button>
              </div>
              {dishError && <p className="error-message">{dishError}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Bill Drawer */}
      {billDrawerOpen && (
        <div className="bill-drawer">
          <button className="close-drawer-btn" onClick={() => setBillDrawerOpen(false)}>×</button>
          <h2>Pending Bills</h2>
          <div className="table-tabs">
            {Object.keys(orders.reduce((acc, order) => {
              if (order.status !== 'paid') acc[order.table] = true;
              return acc;
            }, {})).map(table => (
              <button key={table} onClick={() => setSelectedBillTable(table)} className={selectedBillTable === table ? 'active' : ''}>
                Table {table}
              </button>
            ))}
          </div>
          {selectedBillTable && (
            <div className="bill-details">
              <h3>Bill for Table {selectedBillTable}</h3>
              <ul>
                {orders.filter(o => o.table === selectedBillTable && o.status !== 'paid').flatMap(o => o.items).map((item, index) => (
                  <li key={index}>
                    <span>{item.name} (x{item.quantity})</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="bill-total">
                <strong>Total:</strong>
                <strong>₹{
                  orders.filter(o => o.table === selectedBillTable && o.status !== 'paid')
                    .reduce((total, order) => total + order.items.reduce((sub, i) => sub + i.price * i.quantity, 0), 0)
                    .toFixed(2)
                }</strong>
              </div>
              <button
                className="pay-btn"
                onClick={() => handlePayment(orders.find(o => o.table === selectedBillTable && o.status !== 'paid')._id)}
              >
                Mark as Paid
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gallery Order Modal */}
      {galleryModalDish && (
        <div className="modal-overlay">
          <form className="order-modal-form" onSubmit={handleGalleryOrder}>
            <button type="button" className="close-modal-btn" onClick={() => setGalleryModalDish(null)}>×</button>
            <img src={galleryModalDish.image || '/images/chef3.png'} alt={galleryModalDish.name} />
            <h2>Order: {galleryModalDish.name}</h2>
            <p>{galleryModalDish.description}</p>
            <div className="price">₹ {galleryModalDish.price}</div>
            <input type="number" placeholder="Table No." value={galleryOrderTableNo} onChange={e => setGalleryOrderTableNo(e.target.value)} required />
            <input type="number" placeholder="Quantity" value={galleryOrderQty} onChange={e => setGalleryOrderQty(e.target.value)} required />
            <input type="text" placeholder="Modifications (e.g., no onions)" value={galleryOrderMods} onChange={e => setGalleryOrderMods(e.target.value)} />
            <button type="submit">Place Order</button>
            {galleryOrderSuccess && <p className="success-message">Order Placed!</p>}
            {galleryOrderError && <p className="error-message">{galleryOrderError}</p>}
          </form>
        </div>
      )}

      <style>{`
        .orders-add-dish-btn {
          position: fixed; top: 32px; right: 140px; z-index: 1202; background: #fff; color: #6366f1; border: 1px solid #6366f1; border-radius: 18px; padding: 12px 28px; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 1.08rem; box-shadow: 0 2px 18px #6366f122; cursor: pointer;
        }
        .orders-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; width: 100%; max-width: 1200px; padding: 120px 40px 40px; }
        .orders-gallery-img-wrap { position: relative; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .orders-gallery-img-wrap:hover { transform: translateY(-5px); }
        .orders-gallery-img { width: 100%; height: 250px; object-fit: cover; }
        .orders-gallery-info-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 16px; color: white; }
        .orders-gallery-name { font-weight: bold; font-size: 1.2rem; }
        .orders-gallery-desc { font-size: 0.9rem; opacity: 0.9; }
        .orders-gallery-price { font-weight: bold; margin-top: 8px; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-content { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px; }
        .modal-content h2 { margin-bottom: 20px; }
        .modal-content input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #ccc; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .modal-actions button { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; }
        .modal-actions button[type="submit"] { background: #6366f1; color: white; }
        .bill-drawer { position: fixed; top: 0; right: 0; width: 350px; height: 100%; background: white; box-shadow: -10px 0 30px rgba(0,0,0,0.1); z-index: 1201; padding: 80px 20px 20px; transform: translateX(0); transition: transform 0.3s; }
        .close-drawer-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 2rem; cursor: pointer; }
        .table-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .table-tabs button { padding: 10px; border: 1px solid #ccc; background: #f0f0f0; border-radius: 8px; cursor: pointer; }
        .table-tabs button.active { background: #6366f1; color: white; border-color: #6366f1; }
        .bill-details ul { list-style: none; padding: 0; margin: 20px 0; }
        .bill-details li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .bill-total { display: flex; justify-content: space-between; font-size: 1.2rem; margin-top: 20px; }
        .pay-btn { width: 100%; padding: 15px; background: #f472b6; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 20px; }
        .order-modal-form { background: white; padding: 30px; border-radius: 16px; text-align: center; position: relative; }
        .order-modal-form img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; }
        .order-modal-form h2 { margin-bottom: 10px; }
        .order-modal-form .price { font-size: 1.5rem; font-weight: bold; color: #6366f1; margin-bottom: 20px; }
        .order-modal-form input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #ccc; }
        .order-modal-form button[type="submit"] { width: 100%; padding: 15px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        .close-modal-btn { position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .success-message { color: green; margin-top: 10px; }
        .error-message { color: red; margin-top: 10px; }
      `}</style>
    </div>
  );
};

export default OrdersPage;