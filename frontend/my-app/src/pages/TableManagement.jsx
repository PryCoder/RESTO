import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TableManagement.css';


export default function TableManagement() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [layout, setLayout] = useState({
    floors: 1,
    floorNames: ['Ground Floor'],
    canvasWidth: 800,
    canvasHeight: 600
  });
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Table management states
  const [showAddTable, setShowAddTable] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [draggedTable, setDraggedTable] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form states
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    tableType: 'normal',
    seats: 4,
    width: 80,
    height: 80,
    color: '#28a745',
    borderColor: '#1e7e34',
    notes: ''
  });
  
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 2,
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: '19:00',
    duration: 120,
    specialRequests: '',
    notes: ''
  });

  // Table position editing state
  const [editingPosition, setEditingPosition] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);

  // 1. Add state for edit modal
  const [showEditTable, setShowEditTable] = useState(false);
  const [editTableForm, setEditTableForm] = useState(tableForm);

  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurantId();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchLayoutData();
      fetchTableStatus();
    }
  }, [restaurantId, selectedDate]);

  const fetchRestaurantId = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/tables/restaurants', { headers });
      if (response.data.restaurants && response.data.restaurants.length > 0) {
        setRestaurantId(response.data.restaurants[0].id);
        setLoading(false);
      } else {
        setError('No restaurants found for this user.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
      setLoading(false);
    }
  };

  const fetchLayoutData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/api/tables/layout/${restaurantId}`, { headers });
      
      setLayout(response.data.layout);
      setTables(response.data.tables);
    } catch (err) {
      console.error('Error fetching layout:', err);
      setError('Failed to load restaurant layout');
    }
  };

  const fetchTableStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/api/tables/tables/${restaurantId}/status?date=${selectedDate}`, { headers });
      
      setTables(response.data.tables);
      setReservations(response.data.reservations);
    } catch (err) {
      console.error('Error fetching table status:', err);
      setError('Failed to load table status');
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const newTable = {
        ...tableForm,
        floor: layout.floorNames[currentFloor],
        floorIndex: currentFloor,
        position: { x: 100, y: 100 } // Default position
      };

      const response = await axios.post(`http://localhost:5000/api/tables/tables/${restaurantId}`, newTable, { headers });
      
      setTables([...tables, response.data.table]);
      setShowAddTable(false);
      setTableForm({
        tableNumber: '',
        tableType: 'normal',
        seats: 4,
        width: 80,
        height: 80,
        color: '#28a745',
        borderColor: '#1e7e34',
        notes: ''
      });
    } catch (err) {
      console.error('Error adding table:', err);
      setError('Failed to add table');
    }
  };

  const handleUpdateTable = async (tableId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`http://localhost:5000/api/tables/tables/${restaurantId}/${tableId}`, updateData, { headers });
      
      setTables(tables.map(table => 
        table.tableId === tableId ? { ...table, ...updateData } : table
      ));
    } catch (err) {
      console.error('Error updating table:', err);
      setError('Failed to update table');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`http://localhost:5000/api/tables/tables/${restaurantId}/${tableId}`, { headers });
      
      setTables(tables.filter(table => table.tableId !== tableId));
    } catch (err) {
      console.error('Error deleting table:', err);
      setError('Failed to delete table');
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const reservationData = {
        ...reservationForm,
        tableId: selectedTable.tableId
      };
      
      console.log('Creating reservation with data:', reservationData);
      console.log('Selected table:', selectedTable);
      
      const response = await axios.post(`http://localhost:5000/api/tables/reservations/${restaurantId}`, reservationData, { headers });
      
      console.log('Reservation created successfully:', response.data);
      
      setShowReservationForm(false);
      setSelectedTable(null);
      setReservationForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        partySize: 2,
        reservationDate: new Date().toISOString().split('T')[0],
        reservationTime: '19:00',
        duration: 120,
        specialRequests: '',
        notes: ''
      });
      
      fetchTableStatus();
    } catch (err) {
      console.error('Error creating reservation:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to create reservation');
    }
  };

  const handleUpdateReservationStatus = async (reservationId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`http://localhost:5000/api/tables/reservations/${reservationId}/status`, { status }, { headers });
      
      fetchTableStatus();
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Failed to update reservation status');
    }
  };

  // Drag and drop functionality
  const handleMouseDown = (e, table) => {
    if (e.target.closest('.table-controls')) return;
    
    // Only allow dragging if in editing mode and this is the table being edited
    if (!isEditingMode || editingTableId !== table.tableId) {
      return;
    }
    
    setIsDragging(true);
    setDraggedTable(table);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDraggedTable({ ...table, position: { x, y } });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedTable || !isEditingMode || editingTableId !== draggedTable.tableId) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, layout.canvasWidth - draggedTable.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, layout.canvasHeight - draggedTable.height));
    
    const newPosition = { x, y };
    setDraggedTable({ ...draggedTable, position: newPosition });
    
    // Update the table in the local state immediately for smooth dragging
    setTables(prevTables => 
      prevTables.map(table => 
        table.tableId === draggedTable.tableId 
          ? { ...table, position: newPosition }
          : table
      )
    );
  };

  const handleMouseUp = async () => {
    if (!isDragging || !draggedTable || !isEditingMode) return;
    
    setIsDragging(false);
    setDraggedTable(null);
    // Don't save automatically - user must click "Save Position" button
  };

  const getTableColor = (table) => {
    switch (table.status) {
      case 'available':
        return '#28a745';
      case 'occupied':
        return '#dc3545';
      case 'reserved':
        return '#ffc107';
      case 'maintenance':
        return '#6c757d';
      default:
        return table.color;
    }
  };

  const getTableBorderColor = (table) => {
    switch (table.status) {
      case 'available':
        return '#1e7e34';
      case 'occupied':
        return '#c82333';
      case 'reserved':
        return '#e0a800';
      case 'maintenance':
        return '#545b62';
      default:
        return table.borderColor;
    }
  };

  const handleBack = () => {
    navigate('/manager/dashboard');
  };

  const handleSaveLayout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Save layout configuration
      await axios.put(`http://localhost:5000/api/tables/layout/${restaurantId}`, {
        layout: layout
      }, { headers });
      
      // Save all table positions
      for (const table of tables) {
        await axios.put(`http://localhost:5000/api/tables/tables/${restaurantId}/${table.tableId}`, {
          position: table.position
        }, { headers });
      }
      
      setHasUnsavedChanges(false);
      setError('');
      console.log('Layout saved successfully');
    } catch (err) {
      console.error('Error saving layout:', err);
      setError('Failed to save layout');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setEditingPosition(table.position);
  };

  const handlePositionChange = (field, value) => {
    const newPosition = { ...editingPosition, [field]: parseInt(value) || 0 };
    setEditingPosition(newPosition);
    
    // Update the table in local state
    setTables(prevTables => 
      prevTables.map(table => 
        table.tableId === selectedTable.tableId 
          ? { ...table, position: newPosition }
          : table
      )
    );
    
    setHasUnsavedChanges(true);
  };

  const handleStartEditing = (tableId) => {
    setIsEditingMode(true);
    setEditingTableId(tableId);
    setHasUnsavedChanges(true);
  };

  const handleStopEditing = () => {
    setIsEditingMode(false);
    setEditingTableId(null);
  };

  const handleSavePosition = async () => {
    if (!editingTableId) return;
    try {
      const table = tables.find(t => t.tableId === editingTableId);
      if (table) {
        // Ensure x and y are numbers
        const safePosition = {
          x: Number(table.position.x),
          y: Number(table.position.y)
        };
        // Send the full table object with updated position
        await handleUpdateTable(editingTableId, { ...table, position: safePosition });
        setHasUnsavedChanges(false);
        handleStopEditing();
        console.log('Position saved successfully');
      }
    } catch (err) {
      console.error('Failed to save position:', err);
      setError('Failed to save position');
    }
  };

  // 2. Add function to open edit modal with selected table info
  const handleEditTable = () => {
    setEditTableForm({
      tableNumber: selectedTable.tableNumber,
      tableType: selectedTable.tableType,
      seats: selectedTable.seats,
      width: selectedTable.width,
      height: selectedTable.height,
      color: selectedTable.color,
      borderColor: selectedTable.borderColor,
      notes: selectedTable.notes || ''
    });
    setShowEditTable(true);
  };

  // 3. Add function to submit edit
  const handleEditTableSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:5000/api/tables/tables/${restaurantId}/${selectedTable.tableId}`, editTableForm, { headers });
      setTables(tables.map(table => table.tableId === selectedTable.tableId ? { ...table, ...editTableForm } : table));
      setShowEditTable(false);
      setSelectedTable({ ...selectedTable, ...editTableForm });
    } catch (err) {
      setError('Failed to update table');
    }
  };

  // 4. Add functions for reservation status update
  const handleCompleteReservation = async () => {
    if (!selectedTable.currentReservation) return;
    await handleUpdateReservationStatus(selectedTable.currentReservation.reservationId, 'completed');
    setSelectedTable({ ...selectedTable, status: 'available', currentReservation: null });
  };
  const handleCancelReservation = async () => {
    try {
      // Always fetch latest reservations before attempting to cancel
      await fetchTableStatus();

      // Find the most recent, non-cancelled reservation for this table
      const found = reservations
        .filter(r => r.tableId === selectedTable.tableId && !['cancelled', 'completed', 'no-show'].includes(r.status))
        .sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate))[0];

      if (!found) {
        setError('No active reservation found to cancel.');
        return;
      }

      await handleUpdateReservationStatus(found._id, 'cancelled');
      setSelectedTable({ ...selectedTable, status: 'available', currentReservation: null });
      await fetchTableStatus(); // Refresh UI
    } catch (err) {
      setError('Failed to cancel reservation.');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e9ecef', 
            borderTop: '4px solid #007bff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <p style={{ color: '#6c757d', fontSize: '18px' }}>Loading Table Management...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const currentFloorTables = tables.filter(table => table.floorIndex === currentFloor);

  return (
    <div className="tm-root" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <div className="tm-aurora-bg">
        <div className="tm-aurora-blob tm-aurora-blob1" />
        <div className="tm-aurora-blob tm-aurora-blob2" />
        <div className="tm-aurora-blob tm-aurora-blob3" />
      </div>
      {/* Sticky Header */}
      <header className="tm-header">
        <div className="tm-header-content">
          <h2>🪑 Tables & Reservations</h2>
          <p>Manage table layouts, handle reservations, and optimize seating arrangements</p>
        </div>
        <div className="tm-header-actions">
          <button onClick={handleBack} className="tm-btn tm-btn-secondary">← Back to Dashboard</button>
          <button onClick={() => setShowAddTable(true)} className="tm-btn tm-btn-primary">➕ Add Table</button>
          {hasUnsavedChanges && (
            <button onClick={handleSaveLayout} className="tm-btn tm-btn-save">💾 Save Layout</button>
          )}
        </div>
      </header>
      {/* Error Display */}
      {error && (
        <div className="tm-error">
          {error}
          <button onClick={() => setError('')} className="tm-error-close">×</button>
        </div>
      )}
      {/* Controls */}
      <div className="tm-controls">
        {/* Floor Selection */}
        <div className="tm-card tm-card-control">
          <h3>Floor Selection</h3>
          <select value={currentFloor} onChange={(e) => setCurrentFloor(parseInt(e.target.value))} className="tm-input">
            {layout.floorNames.map((floorName, index) => (
              <option key={index} value={index}>{floorName}</option>
            ))}
          </select>
        </div>
        {/* Date Selection */}
        <div className="tm-card tm-card-control">
          <h3>Date</h3>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="tm-input" />
        </div>
        {/* Status Legend */}
        <div className="tm-card tm-card-control">
          <h3>Status Legend</h3>
          <div className="tm-legend">
            <div className="tm-legend-item"><span className="tm-legend-dot tm-legend-available"></span>Available</div>
            <div className="tm-legend-item"><span className="tm-legend-dot tm-legend-occupied"></span>Occupied</div>
            <div className="tm-legend-item"><span className="tm-legend-dot tm-legend-reserved"></span>Reserved</div>
            <div className="tm-legend-item"><span className="tm-legend-dot tm-legend-maintenance"></span>Maintenance</div>
          </div>
        </div>
      </div>
      {/* 2D Restaurant Layout */}
      <div className="tm-card tm-card-floating tm-layout-area">
        <h3>{layout.floorNames[currentFloor]} - Restaurant Layout</h3>
        <div className="tm-layout-canvas" ref={canvasRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ width: layout.canvasWidth, height: layout.canvasHeight }}>
          <div className="tm-grid-animated" />
          {currentFloorTables.map((table) => (
            <div
              key={table.tableId}
              className={`tm-table ${isEditingMode && editingTableId === table.tableId ? 'tm-table-editing' : ''}`}
              style={{
                left: table.position.x,
                top: table.position.y,
                width: table.width,
                height: table.height,
                backgroundColor: isEditingMode && editingTableId === table.tableId ? '#ffb347' : getTableColor(table),
                borderColor: isEditingMode && editingTableId === table.tableId ? '#ff9800' : getTableBorderColor(table),
                zIndex: isEditingMode && editingTableId === table.tableId ? 1000 : 1
              }}
              onMouseDown={(e) => handleMouseDown(e, table)}
              onClick={() => handleTableSelect(table)}
            >
              <div className="tm-table-number">{table.tableNumber}</div>
              <div className="tm-table-seats">{table.seats} seats</div>
              <div className="tm-table-type">{table.tableType}</div>
              <div className="table-controls">
                <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.tableId); }} className="tm-btn tm-btn-delete">×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Table Details and Reservations */}
      {selectedTable && (
        <div className="tm-card tm-card-floating tm-details-area">
          <div className="tm-details-header">
            <h3>Table {selectedTable.tableNumber} Details</h3>
            <button
              onClick={() => setSelectedTable(null)}
              className="tm-btn tm-btn-close"
            >
              ×
            </button>
          </div>
          <div className="tm-details-content">
            <div className="tm-details-section">
              <h4>Table Information</h4>
              <div className="tm-details-info">
                <p><strong>Type:</strong> {selectedTable.tableType}</p>
                <p><strong>Seats:</strong> {selectedTable.seats}</p>
                <p><strong>Floor:</strong> {selectedTable.floor}</p>
                <p><strong>Status:</strong> 
                  <span className={`tm-status-dot tm-status-${selectedTable.status.toLowerCase()}`}></span>
                  <span className="tm-status-text">{selectedTable.status}</span>
                </p>
                {selectedTable.notes && <p><strong>Notes:</strong> {selectedTable.notes}</p>}
                <button
                  onClick={handleEditTable}
                  className="tm-btn tm-btn-edit"
                >
                  ✏️ Edit Table
                </button>
              </div>
            </div>
            
            <div className="tm-details-section">
              <h4>Current Reservation</h4>
              {selectedTable.currentReservation ? (
                <div className="tm-details-reservation">
                  <p><strong>Customer:</strong> {selectedTable.currentReservation.customerName}</p>
                  <p><strong>Phone:</strong> {selectedTable.currentReservation.customerPhone}</p>
                  <p><strong>Party Size:</strong> {selectedTable.currentReservation.partySize}</p>
                  <p><strong>Time:</strong> {selectedTable.currentReservation.reservationTime}</p>
                  <p><strong>Duration:</strong> {selectedTable.currentReservation.expectedDuration} min</p>
                  {selectedTable.currentReservation.notes && (
                    <p><strong>Notes:</strong> {selectedTable.currentReservation.notes}</p>
                  )}
                  <div className="tm-details-actions">
                    <button
                      onClick={handleCompleteReservation}
                      className="tm-btn tm-btn-complete"
                    >
                      Complete
                    </button>
                    <button
                      onClick={handleCancelReservation}
                      className="tm-btn tm-btn-cancel"
                    >
                      Cancel Reservation
                    </button>
                  </div>
                </div>
              ) : (
                <p className="tm-details-no-reservation">No current reservation</p>
              )}
              <div className="tm-details-actions">
                <button
                  onClick={() => setShowReservationForm(true)}
                  disabled={selectedTable.status !== 'available'}
                  className={`tm-btn tm-btn-reserve ${selectedTable.status === 'available' ? 'tm-btn-active' : 'tm-btn-disabled'}`}
                >
                  Make Reservation
                </button>
                <button
                  onClick={handleCancelReservation}
                  disabled={selectedTable.status === 'available'}
                  className={`tm-btn tm-btn-cancel ${selectedTable.status !== 'available' ? 'tm-btn-active' : 'tm-btn-disabled'}`}
                >
                  Cancel Reservation
                </button>
              </div>
              {selectedTable.status !== 'available' && !selectedTable.currentReservation && (
                <p className="tm-details-not-available">Table is not available for reservation.</p>
              )}
            </div>

            <div className="tm-details-section">
              <h4>Position</h4>
              <div className="tm-details-position">
                <div>
                  <label>X Position</label>
                  <input
                    type="number"
                    value={editingPosition.x}
                    onChange={(e) => handlePositionChange('x', e.target.value)}
                    className="tm-input"
                    min="0"
                    max={layout.canvasWidth}
                  />
                </div>
                <div>
                  <label>Y Position</label>
                  <input
                    type="number"
                    value={editingPosition.y}
                    onChange={(e) => handlePositionChange('y', e.target.value)}
                    className="tm-input"
                    min="0"
                    max={layout.canvasHeight}
                  />
                </div>
              </div>
              <div className="tm-details-actions">
                {!isEditingMode ? (
                  <button
                    onClick={() => handleStartEditing(selectedTable.tableId)}
                    className="tm-btn tm-btn-edit"
                  >
                    ✏️ Update Position
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSavePosition}
                      className="tm-btn tm-btn-save"
                    >
                      💾 Save Position
                    </button>
                    <button
                      onClick={handleStopEditing}
                      className="tm-btn tm-btn-cancel"
                    >
                      ❌ Cancel
                    </button>
                  </>
                )}
              </div>
              {isEditingMode && editingTableId === selectedTable.tableId && (
                <p className="tm-details-instructions">🖱️ Click and drag the table to move it, then click "Save Position"</p>
              )}
              {hasUnsavedChanges && !isEditingMode && (
                <p className="tm-details-unsaved">⚠️ Position changed. Click "Save Layout" to save changes.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Table Form */}
      {showAddTable && (
        <div className="tm-modal tm-modal-add tm-card-floating">
          <div className="tm-modal-content">
            <h3>Add New Table</h3>
            <form onSubmit={handleAddTable}>
              <div className="tm-form-group">
                <label>Table Number *</label>
                <input
                  type="text"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({...tableForm, tableNumber: e.target.value})}
                  required
                  className="tm-input"
                  placeholder="e.g., T1, VIP-1, 5"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Table Type</label>
                <select
                  value={tableForm.tableType}
                  onChange={(e) => setTableForm({...tableForm, tableType: e.target.value})}
                  className="tm-input"
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="tm-form-group">
                <label>Number of Seats *</label>
                <input
                  type="number"
                  value={tableForm.seats}
                  onChange={(e) => setTableForm({...tableForm, seats: parseInt(e.target.value)})}
                  required
                  min="1"
                  max="20"
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Width (px)</label>
                <input
                  type="number"
                  value={tableForm.width}
                  onChange={(e) => setTableForm({...tableForm, width: parseInt(e.target.value)})}
                  min="40"
                  max="200"
                  className="tm-input"
                />
              </div>
              <div className="tm-form-group">
                <label>Height (px)</label>
                <input
                  type="number"
                  value={tableForm.height}
                  onChange={(e) => setTableForm({...tableForm, height: parseInt(e.target.value)})}
                  min="40"
                  max="200"
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Notes</label>
                <textarea
                  value={tableForm.notes}
                  onChange={(e) => setTableForm({...tableForm, notes: e.target.value})}
                  className="tm-input"
                  placeholder="Optional notes about this table..."
                />
              </div>

              <div className="tm-form-actions">
                <button type="submit" className="tm-btn tm-btn-add">Add Table</button>
                <button type="button" onClick={() => setShowAddTable(false)} className="tm-btn tm-btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Form */}
      {showReservationForm && (
        <div className="tm-modal tm-modal-reserve tm-card-floating">
          <div className="tm-modal-content">
            <h3>Make Reservation - Table {selectedTable?.tableNumber}</h3>
            <form onSubmit={handleCreateReservation}>
              <div className="tm-form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  value={reservationForm.customerName}
                  onChange={(e) => setReservationForm({...reservationForm, customerName: e.target.value})}
                  required
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={reservationForm.customerPhone}
                  onChange={(e) => setReservationForm({...reservationForm, customerPhone: e.target.value})}
                  required
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={reservationForm.customerEmail}
                  onChange={(e) => setReservationForm({...reservationForm, customerEmail: e.target.value})}
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Party Size *</label>
                <input
                  type="number"
                  value={reservationForm.partySize}
                  onChange={(e) => setReservationForm({...reservationForm, partySize: parseInt(e.target.value)})}
                  required
                  min="1"
                  max={selectedTable?.seats || 20}
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Duration (min)</label>
                <input
                  type="number"
                  value={reservationForm.duration}
                  onChange={(e) => setReservationForm({...reservationForm, duration: parseInt(e.target.value)})}
                  min="30"
                  max="480"
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={reservationForm.reservationDate}
                  onChange={(e) => setReservationForm({...reservationForm, reservationDate: e.target.value})}
                  required
                  className="tm-input"
                />
              </div>
              <div className="tm-form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={reservationForm.reservationTime}
                  onChange={(e) => setReservationForm({...reservationForm, reservationTime: e.target.value})}
                  required
                  className="tm-input"
                />
              </div>
              
              <div className="tm-form-group">
                <label>Special Requests</label>
                <textarea
                  value={reservationForm.specialRequests}
                  onChange={(e) => setReservationForm({...reservationForm, specialRequests: e.target.value})}
                  className="tm-input"
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>

              <div className="tm-form-actions">
                <button type="submit" className="tm-btn tm-btn-reserve">Create Reservation</button>
                <button type="button" onClick={() => setShowReservationForm(false)} className="tm-btn tm-btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reservations List */}
      <div className="tm-card tm-card-floating tm-reservations-area">
        <h3>Reservations for {new Date(selectedDate).toLocaleDateString()}</h3>
        
        {reservations.length === 0 ? (
          <p className="tm-reservations-empty">No reservations for this date</p>
        ) : (
          <div className="tm-reservations-list">
            <table className="tm-reservations-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Customer</th>
                  <th>Time</th>
                  <th>Party Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation._id}>
                    <td>{tables.find(t => t.tableId === reservation.tableId)?.tableNumber || reservation.tableId}</td>
                    <td>
                      <div>
                        <div className="tm-reservation-name">{reservation.customerName}</div>
                        <div className="tm-reservation-phone">{reservation.customerPhone}</div>
                      </div>
                    </td>
                    <td>{reservation.reservationTime}</td>
                    <td>{reservation.partySize}</td>
                    <td>
                      <span className={`tm-status-dot tm-status-${reservation.status.toLowerCase()}`}></span>
                      <span className="tm-status-text">{reservation.status}</span>
                    </td>
                    <td>
                      <select
                        value={reservation.status}
                        onChange={(e) => handleUpdateReservationStatus(reservation._id, e.target.value)}
                        className="tm-status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Table Modal */}
      {showEditTable && (
        <div className="tm-modal tm-modal-edit tm-card-floating">
          <div className="tm-modal-content">
            <h3>Edit Table</h3>
            <form onSubmit={handleEditTableSubmit}>
              <div className="tm-form-group">
                <label>Table Number *</label>
                <input
                  type="text"
                  value={editTableForm.tableNumber}
                  onChange={(e) => setEditTableForm({...editTableForm, tableNumber: e.target.value})}
                  required
                  className="tm-input"
                  placeholder="e.g., T1, VIP-1, 5"
                />
              </div>
              <div className="tm-form-group">
                <label>Table Type</label>
                <select
                  value={editTableForm.tableType}
                  onChange={(e) => setEditTableForm({...editTableForm, tableType: e.target.value})}
                  className="tm-input"
                >
                  <option value="normal">Normal</option>
                  <option value="vip">VIP</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="tm-form-group">
                <label>Number of Seats *</label>
                <input
                  type="number"
                  value={editTableForm.seats}
                  onChange={(e) => setEditTableForm({...editTableForm, seats: parseInt(e.target.value)})}
                  required
                  min="1"
                  max="20"
                  className="tm-input"
                />
              </div>
              <div className="tm-form-group">
                <label>Width (px)</label>
                <input
                  type="number"
                  value={editTableForm.width}
                  onChange={(e) => setEditTableForm({...editTableForm, width: parseInt(e.target.value)})}
                  min="40"
                  max="200"
                  className="tm-input"
                />
              </div>
              <div className="tm-form-group">
                <label>Height (px)</label>
                <input
                  type="number"
                  value={editTableForm.height}
                  onChange={(e) => setEditTableForm({...editTableForm, height: parseInt(e.target.value)})}
                  min="40"
                  max="200"
                  className="tm-input"
                />
              </div>
              <div className="tm-form-group">
                <label>Notes</label>
                <textarea
                  value={editTableForm.notes}
                  onChange={(e) => setEditTableForm({...editTableForm, notes: e.target.value})}
                  className="tm-input"
                  placeholder="Optional notes about this table..."
                />
              </div>

              <div className="tm-form-actions">
                <button type="submit" className="tm-btn tm-btn-save">Save Changes</button>
                <button type="button" onClick={() => setShowEditTable(false)} className="tm-btn tm-btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="tm-footer">© {new Date().getFullYear()} Resto Table Management</footer>
    </div>
  );
} 