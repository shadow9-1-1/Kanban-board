// VirtualizedCardList - Virtualized list for rendering large numbers of cards efficiently
import { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { List } from 'react-window'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import PropTypes from 'prop-types'
import Card from './Card'

export const VIRTUALIZATION_THRESHOLD = 30
const CARD_HEIGHT = 100
const CARD_GAP = 8

// Individual virtualized card row renderer
const CardRow = memo(function CardRow({ data, index, style }) {
  const { cards, columnId, onCardClick, onDeleteCard } = data
  const card = cards[index]

  if (!card) return null

  return (
    <div style={{ ...style, paddingBottom: CARD_GAP }}>
      <Card card={card} columnId={columnId} onClick={onCardClick} onDelete={onDeleteCard} />
    </div>
  )
})

CardRow.propTypes = {
  data: PropTypes.shape({
    cards: PropTypes.array.isRequired,
    columnId: PropTypes.string.isRequired,
    onCardClick: PropTypes.func.isRequired,
    onDeleteCard: PropTypes.func.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
}

function VirtualizedCardList({ cards, columnId, height = 400, onCardClick, onDeleteCard }) {
  const listRef = useRef(null)
  const [listHeight, setListHeight] = useState(height)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setListHeight(entry.contentRect.height)
        }
      })
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  const itemData = useMemo(() => ({ cards, columnId, onCardClick, onDeleteCard }), [cards, columnId, onCardClick, onDeleteCard])
  const cardIds = useMemo(() => cards.map((c) => c.id), [cards])
  const shouldVirtualize = cards.length > VIRTUALIZATION_THRESHOLD

  const scrollToCard = useCallback((cardId) => {
    const index = cards.findIndex((c) => c.id === cardId)
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToItem(index, 'center')
    }
  }, [cards])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollToCard = scrollToCard
  }, [scrollToCard])

  if (!shouldVirtualize) {
    return (
      <div ref={containerRef} className="flex flex-1 flex-col gap-2 overflow-y-auto" data-testid={`card-list-${columnId}`}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} columnId={columnId} onClick={onCardClick} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden" data-testid={`virtualized-card-list-${columnId}`}>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <List ref={listRef} height={listHeight} itemCount={cards.length} itemSize={CARD_HEIGHT + CARD_GAP} itemData={itemData} width="100%" overscanCount={5} className="scrollbar-thin scrollbar-thumb-gray-300">
          {CardRow}
        </List>
      </SortableContext>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-1 text-center text-xs text-gray-400">📊 Virtualized: {cards.length} cards</div>
      )}
    </div>
  )
}

VirtualizedCardList.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, title: PropTypes.string.isRequired })).isRequired,
  columnId: PropTypes.string.isRequired,
  height: PropTypes.number,
  onCardClick: PropTypes.func.isRequired,
  onDeleteCard: PropTypes.func.isRequired,
}

export default memo(VirtualizedCardList)

// Hook to manage virtualized list state
export function useVirtualizedList(cards, containerRef) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  const handleScroll = useCallback((scrollTop) => {
    const start = Math.floor(scrollTop / (CARD_HEIGHT + CARD_GAP))
    const visibleCount = Math.ceil(400 / (CARD_HEIGHT + CARD_GAP))
    const end = Math.min(start + visibleCount + 10, cards.length)
    setVisibleRange({ start: Math.max(0, start - 5), end })
  }, [cards.length])

  return { visibleRange, handleScroll, totalHeight: cards.length * (CARD_HEIGHT + CARD_GAP) }
}
