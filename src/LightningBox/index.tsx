import { useEffect, useState, useRef } from 'react'
import './index.css'

type ShortcutType = 'exe' | 'folder' | 'url' | 'document'

interface Shortcut {
  id: string
  name: string
  path: string
  type: ShortcutType
  icon?: string
}

interface Category {
  id: string
  name: string
  icon?: string
  shortcuts: Shortcut[]
}

interface LightningBoxProps {
  enterAction: any
}

const STORAGE_KEY = 'lightning-box-data'

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

function loadData(): { categories: Category[], wallpaper: string, searchHistory: string[] } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { categories: DEFAULT_CATEGORIES, wallpaper: '', searchHistory: [] }
}

function saveData(data: { categories: Category[], wallpaper: string, searchHistory: string[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const typeIcons: Record<ShortcutType, string> = {
  exe: '⚙',
  folder: '📁',
  url: '🌐',
  document: '📄'
}

export default function LightningBox({ enterAction }: LightningBoxProps) {
  const [data, setData] = useState(loadData)
  const [activeCategory, setActiveCategory] = useState('software')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState<{ categoryId: string, shortcut?: Shortcut } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, shortcut: Shortcut, categoryId: string } | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ shortcutId: string, categoryId: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { categories, wallpaper, searchHistory } = data

  useEffect(() => {
    saveData(data)
  }, [data])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleAddShortcut = (type: ShortcutType, name: string, path: string) => {
    if (!showAddModal || !name.trim() || !path.trim()) return
    const newShortcut: Shortcut = { id: generateId(), name: name.trim(), path: path.trim(), type }
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

  const handleSelectFile = (type: ShortcutType) => {
    if (type === 'url') return null
    const props = type === 'folder' ? ['openDirectory'] : ['openFile']
    const filters = type === 'exe' || type === 'folder'
      ? [{ name: type === 'exe' ? '应用程序' : '文件夹', extensions: ['*'] }]
      : [{ name: '所有文件', extensions: ['*'] }]
    
    const files = window.ztools.showOpenDialog({ title: '选择文件', properties: props, filters })
    return files && files.length > 0 ? files[0] : null
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
    e.stopPropagation()
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
        if (c.id === draggedItem.categoryId) {
          return { ...c, shortcuts: c.shortcuts.filter(s => s.id !== draggedItem.shortcutId) }
        }
        if (c.id === targetCategoryId) {
          return { ...c, shortcuts: [...c.shortcuts, shortcut] }
        }
        return c
      })
    })
    setDraggedItem(null)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() && !searchHistory.includes(query.trim())) {
      setData({ ...data, searchHistory: [query.trim(), ...searchHistory.slice(0, 9)] })
    }
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
          ref={searchInputRef}
          type="text"
          placeholder="搜索应用、网址、文件..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
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
            <button onClick={() => setData({ ...data, wallpaper: '', searchHistory: [] })}>重置设置</button>
          </div>
        </div>
      )}

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={activeCategory === cat.id ? 'active' : ''}
            onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="content">
        {searchQuery ? (
          <div className="search-results">
            <div className="results-header">搜索结果 ({filteredShortcuts.length})</div>
            <div className="shortcut-grid">
              {filteredShortcuts.map(s => (
                <div
                  key={s.id}
                  className="shortcut-card"
                  onClick={() => handleLaunch(s)}
                  onContextMenu={e => handleContextMenu(e, s, s.categoryName ? categories.find(c => c.name === s.categoryName)?.id || '' : '')}
                >
                  <div className="shortcut-icon">{typeIcons[s.type]}</div>
                  <div className="shortcut-name">{s.name}</div>
                  <div className="shortcut-category">{s.categoryName}</div>
                </div>
              ))}
              {filteredShortcuts.length === 0 && <div className="empty">未找到匹配结果</div>}
            </div>
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
                <div className="shortcut-icon">{typeIcons[s.type]}</div>
                <div className="shortcut-name">{s.name}</div>
                <div className="shortcut-path">{s.path}</div>
              </div>
            ))}
            <div className="add-card" onClick={() => setShowAddModal({ categoryId: activeCategory })}>
              <div className="add-icon">+</div>
              <div>添加</div>
            </div>
            {currentCategory?.shortcuts.length === 0 && (
              <div className="empty">暂无快捷方式，点击添加</div>
            )}
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
  onAdd: (type: ShortcutType, name: string, path: string) => void
  onSelectFile: (type: ShortcutType) => string | null
  onClose: () => void
}) {
  const [type, setType] = useState<ShortcutType>(shortcut?.type || 'exe')
  const [name, setName] = useState(shortcut?.name || '')
  const [path, setPath] = useState(shortcut?.path || '')

  const handleBrowse = () => {
    const selectedPath = onSelectFile(type)
    if (selectedPath) {
      setPath(selectedPath)
      if (!name) {
        const fileName = selectedPath.split(/[/\\]/).pop() || ''
        setName(fileName.replace(/\.[^.]+$/, ''))
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{shortcut ? '编辑' : '添加'}快捷方式 - {category.name}</h2>
        
        <div className="type-selector">
          <button className={type === 'exe' ? 'active' : ''} onClick={() => setType('exe')}>⚙ 软件</button>
          <button className={type === 'folder' ? 'active' : ''} onClick={() => setType('folder')}>📁 文件夹</button>
          <button className={type === 'url' ? 'active' : ''} onClick={() => setType('url')}>🌐 网址</button>
          <button className={type === 'document' ? 'active' : ''} onClick={() => setType('document')}>📄 文档</button>
        </div>

        <input type="text" placeholder="名称" value={name} onChange={e => setName(e.target.value)} />

        {type === 'url' ? (
          <input type="text" placeholder="网址 (https://...)" value={path} onChange={e => setPath(e.target.value)} />
        ) : (
          <div className="path-input">
            <input type="text" placeholder="路径" value={path} onChange={e => setPath(e.target.value)} />
            <button onClick={handleBrowse}>浏览</button>
          </div>
        )}

        <div className="modal-actions">
          <button className="primary" onClick={() => onAdd(type, name, path)}>确定</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}
