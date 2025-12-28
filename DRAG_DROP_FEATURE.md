# Drag and Drop Card Feature 🎴

## Overview
The game now supports **drag-and-drop functionality** to reorder your cards! This makes the game more interactive and strategic, allowing you to prioritize which card gets auto-passed if time runs out.

## Features

### 1. **Drag to Reorder Cards**
- During the PASS PHASE, you can drag and drop cards to rearrange them in any order
- Simply click and hold a card, then drag it to the position you want
- The card will smoothly move to its new position

### 2. **Visual Feedback**
- **Dragging state**: When you drag a card, it becomes slightly transparent and scaled down
- **Drop zone highlight**: The position where you're about to drop gets a blue ring indicator
- **Cursor change**: When hovering over cards, the cursor changes to indicate they're draggable

### 3. **Strategic First Position**
- The **first card** (top card on mobile, leftmost on desktop) is special
- If the 30-second timer runs out, this card is automatically passed
- Use drag-and-drop to strategically place the card you want to auto-pass in the first position

### 4. **Smart Pass Button**
- **"PASS SELECTED"**: When you click on a card to select it
- **"PASS 1ST CARD"**: When no card is selected, passes the first card in your current order
- You can reorder cards and pass without selecting, making it faster to play

## How to Use

### Desktop (4 Cards in a Row)
1. **Hover** over a card you want to move
2. **Click and hold** the mouse button
3. **Drag** the card to your desired position
4. **Release** the mouse button to drop it

### Mobile (1 Large + 3 Small Cards)
1. **Press and hold** on a card
2. **Drag** it to the new position (large card position or small card positions)
3. **Release** to drop it

## Strategy Tips

### 🎯 Smart Card Ordering
- Place the card you're willing to lose in the **first position**
- Keep cards you need for matching in later positions
- Reorder quickly as you receive new cards from other players

### ⏰ Time Management
- Don't panic when timer is low - your first card will auto-pass
- Use the last few seconds to finalize your card order
- Quick drag-and-drop is faster than clicking through menus

### 🎮 Gameplay Flow
1. **Receive cards** from previous player
2. **Analyze** your hand
3. **Drag cards** to optimal positions
4. **Click** a specific card if you want to pass it immediately, OR
5. **Press PASS** to pass the first card without selecting

## UI Hints

### Help Text
When it's your turn to pass, you'll see:
```
💡 Drag cards to reorder • First card auto-passes if time runs out
```

### Card States
- **Normal**: Ready to drag or select
- **Selected**: Blue ring with checkmark (click to select for passing)
- **Dragging**: Transparent and slightly smaller
- **Drop target**: Blue ring indicating drop position

## Technical Details

### Responsive Design
- **Mobile**: First card displayed large, remaining 3 in a grid below
- **Desktop**: All 4 cards in a horizontal row
- Drag-and-drop works seamlessly on both layouts

### Animation
- Smooth transitions when cards change position
- Framer Motion animations for visual polish
- No lag or performance issues during dragging

## Accessibility

### Fallback Options
- Drag-and-drop is **optional** - you can still click to select cards
- Original click-to-select functionality fully preserved
- Works on touch devices (mobile/tablet)

### Visual Indicators
- Clear cursor feedback
- Ring highlights show drop zones
- Selected state clearly marked

## Examples

### Example 1: Protecting Good Cards
You have: `[Mango, Mango, Potato, Banana]`
- **Drag** `Potato` or `Banana` to first position
- If timer runs out, you'll auto-pass the unwanted card
- Keep both `Mango` cards safe

### Example 2: Quick Pass
You want to pass a specific card immediately:
- **Option A**: Click the card → Click PASS SELECTED
- **Option B**: Drag it to first position → Click PASS 1ST CARD

### Example 3: Strategic Reordering
As cards come and go:
1. Drag duplicates together for visual clarity
2. Place "sacrificial" cards at the front
3. Keep potential SET combinations organized

## Benefits

✅ **More Control**: Choose exactly which card gets auto-passed  
✅ **Faster Gameplay**: Reorder without multiple clicks  
✅ **Better Strategy**: Organize your hand optimally  
✅ **Visual Clarity**: See your hand layout clearly  
✅ **Mobile Friendly**: Works on touch devices too  

---

Enjoy the enhanced gameplay experience! 🎉
