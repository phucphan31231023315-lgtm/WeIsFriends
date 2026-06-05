'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [places, setPlaces] = useState([]);
  const [activePlaceId, setActivePlaceId] = useState('');
  
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [year, setYear] = useState('2024');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);

  // Location Tab & Form States
  const [activeTab, setActiveTab] = useState('memories'); // 'memories' or 'places'
  const [placeForm, setPlaceForm] = useState({
    id: '',
    name: '',
    prefix: '',
    tagline: '',
    description: ''
  });
  const [editingPlaceId, setEditingPlaceId] = useState(null);

  // Slugify helper to create URL-safe place ID
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // remove diacritics
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes
  };

  // Suggest next prefix
  const getNextPrefix = (currentPlaces) => {
    const existingPrefixes = currentPlaces.map(p => parseInt(p.prefix, 10)).filter(n => !isNaN(n));
    const maxPrefix = existingPrefixes.length > 0 ? Math.max(...existingPrefixes) : 0;
    const nextPrefix = maxPrefix + 1;
    return nextPrefix < 10 ? `0${nextPrefix}` : `${nextPrefix}`;
  };

  const resetPlaceForm = (currentPlaces = places) => {
    setPlaceForm({
      id: '',
      name: '',
      prefix: getNextPrefix(currentPlaces),
      tagline: '',
      description: ''
    });
    setEditingPlaceId(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/memories')
        .then(res => res.json())
        .then(data => {
          const list = data || [];
          setPlaces(list);
          if (list.length > 0) {
            setActivePlaceId(list[0].id);
          } else {
            setActivePlaceId('');
          }
          resetPlaceForm(list);
        });
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '123456') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setPlaceForm(prev => {
      const nextId = editingPlaceId ? prev.id : slugify(val);
      return {
        ...prev,
        name: val,
        id: nextId
      };
    });
  };

  const handleSaveData = async (updatedPlaces) => {
    await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlaces)
    });
    setPlaces(updatedPlaces);
  };

  const handleDelete = async (memoryId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    const updatedPlaces = places.map(place => {
      if (place.id === activePlaceId) {
        return {
          ...place,
          memories: place.memories.filter(m => m.id !== memoryId)
        };
      }
      return place;
    });
    
    await handleSaveData(updatedPlaces);
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!file || !title || !caption) return alert('Please fill all fields');
    
    setIsUploading(true);
    
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.error) throw new Error(uploadData.error);
      
      // 2. Add to data
      const updatedPlaces = [...places];
      const placeIndex = updatedPlaces.findIndex(p => p.id === activePlaceId);
      if (placeIndex === -1) return alert('Please select a valid location first.');
      const place = updatedPlaces[placeIndex];
      
      const newIndex = place.memories.length;
      const colors = ['#ffbb00', '#00ffaa', '#ff5500', '#33ccff', '#ff0055'];
      
      const newMemory = {
        id: `${activePlaceId}-${Date.now()}`,
        image: uploadData.url,
        title,
        caption,
        year,
        glowColor: colors[newIndex % colors.length],
        position: [
          newIndex % 2 === 0 ? -2.5 : 2.5,
          0.2 + Math.random() * 0.6,
          -8 - (newIndex * 8)
        ]
      };
      
      updatedPlaces[placeIndex] = {
        ...place,
        memories: [...place.memories, newMemory]
      };
      
      await handleSaveData(updatedPlaces);
      
      // Reset form
      setFile(null);
      setTitle('');
      setCaption('');
      alert('Photo added successfully!');
      
    } catch (err) {
      alert('Error adding photo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMusicUpload = async (selectedAudioFile) => {
    if (!selectedAudioFile) return;
    setIsAudioUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedAudioFile);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.error) throw new Error(uploadData.error);
      
      const updatedPlaces = places.map(place => {
        if (place.id === activePlaceId) {
          return {
            ...place,
            bgMusic: uploadData.url
          };
        }
        return place;
      });
      
      await handleSaveData(updatedPlaces);
      alert('Background music uploaded successfully!');
    } catch (err) {
      alert('Error uploading music: ' + err.message);
    } finally {
      setIsAudioUploading(false);
    }
  };

  const handleResetMusic = async () => {
    if (!confirm('Are you sure you want to reset to the default synthesizer drone?')) return;
    
    const updatedPlaces = places.map(place => {
      if (place.id === activePlaceId) {
        const { bgMusic, ...rest } = place;
        return rest;
      }
      return place;
    });
    
    await handleSaveData(updatedPlaces);
    alert('Reset background music to default synthesizer.');
  };

  const handleEditPlaceClick = (place) => {
    setEditingPlaceId(place.id);
    setPlaceForm({
      id: place.id,
      name: place.name,
      prefix: place.prefix || '',
      tagline: place.tagline || '',
      description: place.description || ''
    });
  };

  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    const { id, name, prefix, tagline, description } = placeForm;
    
    if (!id || !name || !prefix) {
      return alert('Please fill in ID, Name, and Prefix.');
    }
    
    if (!/^[a-z0-9-]+$/.test(id)) {
      return alert('ID must be lowercase alphanumeric and dashes only (e.g. nha-trang).');
    }

    if (editingPlaceId) {
      // Edit existing place
      const updatedPlaces = places.map(p => {
        if (p.id === editingPlaceId) {
          return {
            ...p,
            name,
            prefix,
            tagline,
            description
          };
        }
        return p;
      });
      await handleSaveData(updatedPlaces);
      alert('Location updated successfully!');
      resetPlaceForm(updatedPlaces);
    } else {
      // Check duplicate ID
      if (places.some(p => p.id === id)) {
        return alert(`A location with ID "${id}" already exists. Please choose a different ID.`);
      }
      
      const newPlace = {
        id,
        name,
        prefix,
        tagline,
        description,
        bgMusic: '',
        memories: []
      };
      
      const updatedPlaces = [...places, newPlace];
      await handleSaveData(updatedPlaces);
      alert('New location added successfully!');
      resetPlaceForm(updatedPlaces);
      
      // Auto select the new place
      setActivePlaceId(id);
    }
  };

  const handleDeletePlace = async (placeToDelete) => {
    const photoCount = placeToDelete.memories?.length || 0;
    const confirmMessage = photoCount > 0
      ? `WARNING: Location "${placeToDelete.name}" has ${photoCount} memory photos. Deleting this location will PERMANENTLY delete all of its memories.\n\nAre you sure you want to proceed? Type "DELETE" to confirm.`
      : `Are you sure you want to delete the location "${placeToDelete.name}"?`;
      
    if (photoCount > 0) {
      const confirmation = prompt(confirmMessage);
      if (confirmation !== 'DELETE') return;
    } else {
      if (!confirm(confirmMessage)) return;
    }
    
    const updatedPlaces = places.filter(p => p.id !== placeToDelete.id);
    await handleSaveData(updatedPlaces);
    
    // Fallback if deleted active place
    if (activePlaceId === placeToDelete.id) {
      setActivePlaceId(updatedPlaces[0]?.id || '');
    }
    
    resetPlaceForm(updatedPlaces);
    alert('Location deleted successfully.');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        <form onSubmit={handleLogin} className="p-8 border border-neutral-800 bg-neutral-900 rounded flex flex-col gap-4 w-80">
          <h1 className="text-xl font-bold tracking-widest text-amber-500 text-center">ADMIN LOGIN</h1>
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-700 text-white focus:border-amber-500 outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold tracking-widest transition-colors">
            ENTER
          </button>
        </form>
      </div>
    );
  }

  const activePlace = places.find(p => p.id === activePlaceId);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-neutral-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light tracking-widest mb-2">MEMORY ARCHIVE CMS</h1>
            <p className="text-neutral-400 font-mono text-xs uppercase">Manage your travel gallery</p>
          </div>
          <a href="/" className="px-4 py-2 border border-neutral-800 text-sm hover:bg-neutral-900 rounded transition-colors">
            View Site ↗
          </a>
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 mb-8 font-mono text-xs">
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-6 py-3 border-b-2 font-bold tracking-widest transition-colors ${
              activeTab === 'memories'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            📷 QUẢN LÝ KÝ ỨC / MEMORIES
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`px-6 py-3 border-b-2 font-bold tracking-widest transition-colors ${
              activeTab === 'places'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            📍 QUẢN LÝ ĐỊA ĐIỂM / LOCATIONS
          </button>
        </div>

        {/* Memories Management Tab */}
        {activeTab === 'memories' && (
          places.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 font-mono text-sm border border-neutral-800 border-dashed rounded bg-neutral-900/20">
              Không tìm thấy địa điểm nào. Vui lòng chuyển qua tab <strong className="text-amber-500">📍 QUẢN LÝ ĐỊA ĐIỂM</strong> để thêm trạm dừng đầu tiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-fadeIn">
              
              {/* Left Col: Selector & Form */}
              <div className="md:col-span-1 flex flex-col gap-8">
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Select Place</label>
                  <select 
                    value={activePlaceId}
                    onChange={e => setActivePlaceId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded outline-none focus:border-amber-500"
                  >
                    {places.map(p => (
                      <option key={p.id} value={p.id}>{p.prefix} - {p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Background Music Card */}
                <div className="flex flex-col gap-4 border border-neutral-800 p-6 rounded bg-neutral-900/50">
                  <h2 className="font-mono text-sm tracking-widest text-amber-500 mb-2 border-b border-neutral-800 pb-2">BACKGROUND MUSIC</h2>
                  
                  <div className="text-xs font-mono text-neutral-400 mb-2">
                    <div className="text-neutral-500 uppercase mb-1">Current Ambience:</div>
                    <div className="bg-black/60 p-2 rounded border border-neutral-800 break-all text-[10px]">
                      {activePlace?.bgMusic ? activePlace.bgMusic : '🎶 Synthesizer Drone (Default)'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Upload New Song (.mp3)</label>
                    <input 
                      type="file" 
                      accept="audio/*"
                      onChange={e => handleMusicUpload(e.target.files[0])}
                      disabled={isAudioUploading}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-500 hover:file:bg-amber-500/30 cursor-pointer disabled:opacity-50"
                    />
                    {isAudioUploading && (
                      <div className="text-[10px] font-mono text-amber-500/80 animate-pulse">UPLOADING AUDIO FILE...</div>
                    )}
                  </div>

                  {activePlace?.bgMusic && (
                    <button
                      onClick={handleResetMusic}
                      className="mt-2 bg-red-950/40 hover:bg-red-950/60 border border-red-900/50 text-red-400 hover:text-red-300 font-mono text-xs py-2 rounded transition-colors"
                    >
                      RESET TO DEFAULT SYNTH
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddPhoto} className="flex flex-col gap-4 border border-neutral-800 p-6 rounded bg-neutral-900/50">
                  <h2 className="font-mono text-sm tracking-widest text-amber-500 mb-2 border-b border-neutral-800 pb-2">ADD NEW PHOTO</h2>
                  
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setFile(e.target.files[0])}
                    className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-500 hover:file:bg-amber-500/30"
                    required
                  />
                  
                  <input 
                    type="text" placeholder="Title (e.g. Night Out)" 
                    value={title} onChange={e => setTitle(e.target.value)}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500"
                    required
                  />
                  
                  <input 
                    type="text" placeholder="Year (e.g. 2024)" 
                    value={year} onChange={e => setYear(e.target.value)}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500"
                    required
                  />
                  
                  <textarea 
                    placeholder="Caption..." 
                    value={caption} onChange={e => setCaption(e.target.value)}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 h-24 resize-none"
                    required
                  />
                  
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="mt-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold p-3 rounded tracking-widest text-sm transition-colors"
                  >
                    {isUploading ? 'UPLOADING...' : 'UPLOAD & ADD TO GALLERY'}
                  </button>
                </form>
              </div>

              {/* Right Col: Photo List */}
              <div className="md:col-span-2">
                <h2 className="font-mono text-sm tracking-widest text-neutral-400 mb-6 border-b border-neutral-800 pb-2 uppercase">
                  CURRENT PHOTOS IN {activePlace?.name || 'NONE'} ({(activePlace?.memories || []).length})
                </h2>
                
                <div className="flex flex-col gap-4">
                  {(activePlace?.memories || []).map((m, idx) => (
                    <div key={m.id} className="flex gap-4 items-center bg-neutral-900/40 border border-neutral-800 p-4 rounded group hover:border-neutral-600 transition-colors">
                      <img src={m.image} alt={m.title} className="w-20 h-20 object-cover rounded bg-black" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded">#{idx + 1}</span>
                          <h3 className="font-semibold">{m.title}</h3>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-1">{m.caption}</p>
                        <div className="text-[10px] text-neutral-500 mt-2 font-mono">
                          POS: [{m.position.map(n => n.toFixed(1)).join(', ')}] | COLOR: {m.glowColor}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="px-4 py-2 bg-red-900/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 rounded text-xs font-mono transition-colors"
                      >
                        DELETE
                      </button>
                    </div>
                  ))}
                  
                  {(activePlace?.memories || []).length === 0 && (
                    <div className="p-12 text-center text-neutral-600 font-mono text-sm border border-neutral-800 border-dashed rounded">
                      No photos here yet. Upload one!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        )}

        {/* Locations Management Tab */}
        {activeTab === 'places' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-fadeIn">
            
            {/* Left Column: Form */}
            <div className="md:col-span-1">
              <form onSubmit={handlePlaceSubmit} className="flex flex-col gap-4 border border-neutral-800 p-6 rounded bg-neutral-900/50">
                <h2 className="font-mono text-sm tracking-widest text-amber-500 mb-2 border-b border-neutral-800 pb-2 uppercase">
                  {editingPlaceId ? 'Cập Nhật Địa Điểm' : 'Thêm Địa Điểm Mới'}
                </h2>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Tên Địa Điểm / Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Nha Trang" 
                    value={placeForm.name} 
                    onChange={handleNameChange}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 text-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Số Thứ Tự / Prefix Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 06" 
                    value={placeForm.prefix} 
                    onChange={e => setPlaceForm(prev => ({ ...prev, prefix: e.target.value }))}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 text-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Mã Định Danh / Unique ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. nha-trang" 
                    value={placeForm.id} 
                    onChange={e => setPlaceForm(prev => ({ ...prev, id: slugify(e.target.value) }))}
                    disabled={!!editingPlaceId}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  {!editingPlaceId && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Tự động tạo từ Tên địa điểm. Dùng làm đường dẫn (lowercase, no accent, alphanumeric, dash).
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Câu Giới Thiệu / Tagline</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Biển xanh nắng vàng" 
                    value={placeForm.tagline} 
                    onChange={e => setPlaceForm(prev => ({ ...prev, tagline: e.target.value }))}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Mô Tả / Description</label>
                  <textarea 
                    placeholder="e.g. Một ngày hè rực rỡ..." 
                    value={placeForm.description} 
                    onChange={e => setPlaceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black border border-neutral-800 p-3 rounded text-sm outline-none focus:border-amber-500 text-white h-24 resize-none"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    type="submit" 
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold p-3 rounded tracking-widest text-sm transition-colors uppercase font-mono"
                  >
                    {editingPlaceId ? 'Lưu Cập Nhật' : 'Thêm Địa Điểm'}
                  </button>
                  {editingPlaceId && (
                    <button 
                      type="button"
                      onClick={() => resetPlaceForm()}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs px-4 rounded transition-colors uppercase"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-2">
              <h2 className="font-mono text-sm tracking-widest text-neutral-400 mb-6 border-b border-neutral-800 pb-2 uppercase">
                DANH SÁCH TRẠM DỪNG / CURRENT LOCATIONS ({places.length})
              </h2>
              
              <div className="flex flex-col gap-4">
                {places.map((place, idx) => (
                  <div key={place.id} className="flex gap-4 items-start bg-neutral-900/40 border border-neutral-800 p-4 rounded group hover:border-neutral-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                          {place.prefix || 'N/A'}
                        </span>
                        <h3 className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors">
                          {place.name}
                        </h3>
                        <span className="text-xs font-mono text-neutral-500">
                          ({place.id})
                        </span>
                      </div>
                      {place.tagline && (
                        <p className="text-xs text-amber-500/80 font-mono mb-1">{place.tagline}</p>
                      )}
                      {place.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3">{place.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500">
                        <div>🖼️ SỐ LƯỢNG KÝ ỨC: <span className="text-neutral-300 font-bold">{place.memories?.length || 0}</span></div>
                        <div>🎶 ÂM THANH: <span className="text-neutral-300 truncate max-w-[150px] inline-block align-bottom">{place.bgMusic ? 'Custom MP3' : 'Synth Drone (Mặc định)'}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleEditPlaceClick(place)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs font-mono transition-colors text-center"
                      >
                        SỬA
                      </button>
                      <button 
                        onClick={() => handleDeletePlace(place)}
                        className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/50 rounded text-xs font-mono transition-colors text-center"
                      >
                        XÓA
                      </button>
                    </div>
                  </div>
                ))}
                
                {places.length === 0 && (
                  <div className="p-12 text-center text-neutral-600 font-mono text-sm border border-neutral-800 border-dashed rounded">
                    Chưa có địa điểm nào được tạo. Hãy điền form bên trái để thêm!
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
