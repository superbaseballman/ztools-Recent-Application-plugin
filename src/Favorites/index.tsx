import { useEffect, useState, useRef } from 'react'
import './index.css'

type ShortcutType = 'exe' | 'folder' | 'url' | 'document'

interface Shortcut {
  id: string
  name: string
  path: string
  type: ShortcutType
  icon?: string
  categoryName?: string
}

interface Category {
  id: string
  name: string
  shortcuts: Shortcut[]
}

interface FavoritesProps {
  enterAction: any
}

const DB_DOC_ID = 'lightning-box-data'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'software', name: '软件', shortcuts: [] },
  { id: 'game', name: '游戏', shortcuts: [] },
  { id: 'url', name: '网址', shortcuts: [] },
  { id: 'study', name: '学习', shortcuts: [] },
  { id: 'social', name: '社交', shortcuts: [] }
]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

async function loadData(): Promise<{ categories: Category[], wallpaper: string }> {
  try {
    const doc = await window.ztools.db.get(DB_DOC_ID)
    if (doc) return doc.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
  return { categories: DEFAULT_CATEGORIES, wallpaper: '' }
}

async function saveData(data: { categories: Category[], wallpaper: string }) {
  try {
    const existingDoc = await window.ztools.db.get(DB_DOC_ID)
    const doc = {
      _id: DB_DOC_ID,
      _rev: existingDoc?._rev,
      data: data
    }
    await window.ztools.db.put(doc)
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

export default function Favorites({ enterAction }: FavoritesProps) {
  const [data, setData] = useState<{ categories: Category[], wallpaper: string }>({ categories: DEFAULT_CATEGORIES, wallpaper: '' })
  const [activeCategory, setActiveCategory] = useState('software')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState<{ categoryId: string, shortcut?: Shortcut } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shortcut: Shortcut, categoryId: string } | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ shortcutId: string, categoryId: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { categories, wallpaper } = data

  // 初始化时加载数据
  useEffect(() => {
    loadData().then(initialData => {
      setData(initialData)
      setInitialized(true)
    })
  }, [])

  // 数据变化时自动保存
  useEffect(() => { 
    if (initialized) {
      saveData(data)
    }
  }, [data, initialized])

  const getIcon = (type: ShortcutType) => {
    switch (type) {
      case 'url': return '🌐'
      case 'folder': return '📁'
      case 'document': return '📄'
      default: return '⚙'
    }
  }

  const handleAddShortcut = (type: ShortcutType, name: string, path: string, icon?: string) => {
    if (!showAddModal || !name.trim() || !path.trim()) return
    const newShortcut: Shortcut = { id: generateId(), name: name.trim(), path: path.trim(), type, icon }
    if (showAddModal.shortcut) {
      setData({
        ...data,
        categories: categories.map(c => c.id === showAddModal.categoryId
          ? { ...c, shortcuts: c.shortcuts.map(s => s.id === showAddModal.shortcut!.id ? newShortcut : s) }
          : c
        )
      })
    } else {
      setData({
        ...data,
        categories: categories.map(c => c.id === showAddModal.categoryId
          ? { ...c, shortcuts: [...c.shortcuts, newShortcut] }
          : c
        )
      })
    }
    setShowAddModal(null)
  }

  const handleSelectFile = async (type: ShortcutType) => {
    if (type === 'url') return null
    const props: any = type === 'folder' ? ['openDirectory'] : ['openFile']
    const files = window.ztools.showOpenDialog({ title: '选择文件', properties: props })
    const filePath = files?.[0]
    if (!filePath) return null
    
    let icon: string | undefined
    if (type === 'exe' && window.services?.getAppIcon) {
      icon = await window.services.getAppIcon(filePath)
    }
    
    return { path: filePath, icon }
  }

  const handleLaunch = (shortcut: Shortcut) => {
    window.ztools.shellOpenPath(shortcut.path)
  }

  const handleDelete = (categoryId: string, shortcutId: string) => {
    setData({
      ...data,
      categories: categories.map(c => c.id === categoryId
        ? { ...c, shortcuts: c.shortcuts.filter(s => s.id !== shortcutId) }
        : c
      )
    })
    setContextMenu(null)
  }

  const handleEdit = (categoryId: string, shortcut: Shortcut) => {
    setShowAddModal({ categoryId, shortcut })
    setContextMenu(null)
  }

  const handleContextMenu = (e: React.MouseEvent, shortcut: Shortcut, categoryId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, shortcut, categoryId })
  }

  const handleDragStart = (e: React.DragEvent, shortcutId: string, categoryId: string) => {
    setDraggedItem({ shortcutId, categoryId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault()
    if (!draggedItem) return
    const sourceCategory = categories.find(c => c.id === draggedItem.categoryId)
    const shortcut = sourceCategory?.shortcuts.find(s => s.id === draggedItem.shortcutId)
    if (!shortcut || draggedItem.categoryId === targetCategoryId) {
      setDraggedItem(null)
      return
    }
    setData({
      ...data,
      categories: categories.map(c => {
        if (c.id === draggedItem.categoryId) return { ...c, shortcuts: c.shortcuts.filter(s => s.id !== draggedItem.shortcutId) }
        if (c.id === targetCategoryId) return { ...c, shortcuts: [...c.shortcuts, shortcut] }
        return c
      })
    })
    setDraggedItem(null)
  }

  const filteredShortcuts = searchQuery
    ? categories.flatMap(c => c.shortcuts.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => ({ ...s, categoryName: c.name })))
    : categories.find(c => c.id === activeCategory)?.shortcuts || []

  const currentCategory = categories.find(c => c.id === activeCategory)

  return (
    <div className="lightning-app" style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}>
      <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙</button>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索应用、网址、文件..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>}
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>设置</h3>
          <div className="setting-item">
            <label>壁纸URL:</label>
            <input
              type="text"
              placeholder="输入壁纸图片地址"
              value={wallpaper}
              onChange={e => setData({ ...data, wallpaper: e.target.value })}
            />
          </div>
          <div className="setting-item">
            <button onClick={() => setData({ ...data, wallpaper: '' })}>重置</button>
          </div>
        </div>
      )}

      {!searchQuery && (
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={activeCategory === cat.id ? 'active' : ''}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="content">
        {searchQuery ? (
          <div className="shortcut-grid">
            {filteredShortcuts.map(s => (
              <div
                key={s.id}
                className="shortcut-card"
                onClick={() => handleLaunch(s)}
                onContextMenu={e => handleContextMenu(e, s, s.categoryName ? categories.find(c => c.name === s.categoryName)?.id || '' : '')}
              >
                {s.icon ? <img src={s.icon} alt="" className="shortcut-img" /> : <div className="shortcut-icon">{getIcon(s.type)}</div>}
                <div className="shortcut-name">{s.name}</div>
              </div>
            ))}
            {filteredShortcuts.length === 0 && <div className="empty">未找到</div>}
          </div>
        ) : (
          <div className="shortcut-grid" onDragOver={handleDragOver}>
            {currentCategory?.shortcuts.map(s => (
              <div
                key={s.id}
                className="shortcut-card"
                draggable
                onDragStart={e => handleDragStart(e, s.id, currentCategory.id)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, currentCategory.id)}
                onClick={() => handleLaunch(s)}
                onContextMenu={e => handleContextMenu(e, s, currentCategory.id)}
              >
                {s.icon ? <img src={s.icon} alt="" className="shortcut-img" /> : <div className="shortcut-icon">{getIcon(s.type)}</div>}
                <div className="shortcut-name">{s.name}</div>
              </div>
            ))}
            <div className="add-card" onClick={() => setShowAddModal({ categoryId: activeCategory })}>
              <div className="add-icon">+</div>
              <div>添加</div>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div onClick={() => handleLaunch(contextMenu.shortcut)}>启动</div>
          <div onClick={() => handleEdit(contextMenu.categoryId, contextMenu.shortcut)}>编辑</div>
          <div className="divider" />
          <div className="danger" onClick={() => handleDelete(contextMenu.categoryId, contextMenu.shortcut.id)}>删除</div>
        </div>
      )}

      {showAddModal && (
        <AddShortcutModal
          category={categories.find(c => c.id === showAddModal.categoryId)!}
          shortcut={showAddModal.shortcut}
          onAdd={handleAddShortcut}
          onSelectFile={handleSelectFile}
          onClose={() => setShowAddModal(null)}
        />
      )}
    </div>
  )
}

function AddShortcutModal({ category, shortcut, onAdd, onSelectFile, onClose }: {
  category: Category
  shortcut?: Shortcut
  onAdd: (type: ShortcutType, name: string, path: string, icon?: string) => void
  onSelectFile: (type: ShortcutType) => Promise<{ path: string, icon?: string } | null>
  onClose: () => void
}) {
  const [type, setType] = useState<ShortcutType>(shortcut?.type || 'exe')
  const [name, setName] = useState(shortcut?.name || '')
  const [path, setPath] = useState(shortcut?.path || '')
  const [icon, setIcon] = useState(shortcut?.icon || '')

  const handleBrowse = async () => {
    const result = await onSelectFile(type)
    if (result) {
      setPath(result.path)
      if (result.icon) setIcon(result.icon)
      if (!name) {
        const fileName = result.path.split(/[/\\]/).pop() || ''
        setName(fileName.replace(/\.[^.]+$/, ''))
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{shortcut ? '编辑' : '添加'} - {category.name}</h2>
        
        <div className="type-selector">
          <button className={type === 'exe' ? 'active' : ''} onClick={() => setType('exe')}>⚙</button>
          <button className={type === 'folder' ? 'active' : ''} onClick={() => setType('folder')}>📁</button>
          <button className={type === 'url' ? 'active' : ''} onClick={() => setType('url')}>🌐</button>
          <button className={type === 'document' ? 'active' : ''} onClick={() => setType('document')}>📄</button>
        </div>

        <input type="text" placeholder="名称" value={name} onChange={e => setName(e.target.value)} />

        {icon && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img src={icon} alt="icon" style={{ width: 48, height: 48 }} />
          </div>
        )}

        {type === 'url' ? (
          <input type="text" placeholder="网址" value={path} onChange={e => setPath(e.target.value)} />
        ) : (
          <div className="path-input">
            <input type="text" placeholder="路径" value={path} onChange={e => setPath(e.target.value)} />
            <button onClick={handleBrowse}>浏览</button>
          </div>
        )}

        <div className="modal-actions">
          <button className="primary" onClick={() => onAdd(type, name, path, icon)}>确定</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}
