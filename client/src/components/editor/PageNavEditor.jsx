import { useStore } from '../../store/useStore'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, FileText, Home, Hash } from 'lucide-react'

function SortablePage({ page, schema, isActive, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page })
  const { setPageNavLabel } = useStore()
  const pageDef = schema?.pages?.[page]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  }

  const Icon = page === 'index' ? Home : FileText

  return (
    <div ref={setNodeRef} style={style}
      className={`group flex items-center gap-2 p-2.5 rounded-xl transition-all
        ${isActive ? 'bg-indigo-600/15 border border-indigo-500/25' : 'border border-white/[0.04] hover:bg-white/[0.04]'}`}>
      
      {/* Drag handle */}
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded text-gray-700 hover:text-gray-500 transition-colors touch-none">
        <GripVertical size={13} />
      </button>

      {/* Page info */}
      <button className="flex-1 flex items-center gap-2 text-left" onClick={() => onSelect(page)}>
        <Icon size={12} className={isActive ? 'text-indigo-400' : 'text-gray-600'} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold capitalize truncate ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
            {page}
          </div>
          <div className="text-xs text-gray-700 truncate">{page === 'index' ? '/' : `/${page}`}</div>
        </div>
      </button>

      {/* Nav label input */}
      <input
        className="w-20 text-xs rounded-lg px-2 py-1 text-gray-400"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', outline: 'none' }}
        defaultValue={pageDef?.nav_label || (page.charAt(0).toUpperCase() + page.slice(1))}
        placeholder="Nav label"
        onClick={e => e.stopPropagation()}
        onChange={e => setPageNavLabel(page, e.target.value)}
        title="Navigation menu label"
      />
    </div>
  )
}

export default function PageNavEditor({ activePage, onPageSelect }) {
  const { schema, pageOrder, reorderPages } = useStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = pageOrder.indexOf(active.id)
      const newIdx = pageOrder.indexOf(over.id)
      reorderPages(arrayMove(pageOrder, oldIdx, newIdx))
    }
  }

  if (!pageOrder.length) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-3">
        <Hash size={11} className="text-gray-600" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Page Order</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pageOrder} strategy={verticalListSortingStrategy}>
          {pageOrder.map(page => (
            <SortablePage key={page} page={page} schema={schema}
              isActive={activePage === page}
              onSelect={onPageSelect} />
          ))}
        </SortableContext>
      </DndContext>
      <p className="text-xs text-gray-700 text-center pt-1">Drag to reorder navigation</p>
    </div>
  )
}
