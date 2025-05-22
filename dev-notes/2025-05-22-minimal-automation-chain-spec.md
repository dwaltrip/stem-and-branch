# 2025-05-22 Minimal Automation Chain Specification

## Updated Minimal Automation Chain Spec

### **Mining Drill**

#### **Core State**
- `position: {x: number, y: number}` (grid coordinates)
- `outputDirection: Direction` (NORTH/SOUTH/EAST/WEST - which side outputs)
- `ironOreCount: number` (internal storage, max capacity: 10)
- `miningTicksRemaining: number` (ticks until next ore is mined)

#### **Actions**
- **Mine**: Every 60 ticks, if `ironOreCount < 10`, increment `ironOreCount` by 1, reset timer
- **Attempt Output**: Each tick, if `ironOreCount > 0` and has valid tube connection, transfer 1 ore to tube
- **Block Mining**: When `ironOreCount >= 10`, pause mining timer

### **Transport Tube**

#### **Core State**
- `position: {x: number, y: number}` (grid coordinates) 
- `direction: Direction` (NORTH/SOUTH/EAST/WEST - which way items flow)
- `ironOreCount: number` (items in tube, max capacity: 5)
- `transportTicksRemaining: number` (ticks until next item moves out)

#### **Actions**
- **Move Item**: Every 30 ticks, if `ironOreCount > 0`, move 1 ore out (into void for now), reset timer
- **Accept Input**: If `ironOreCount < 5`, accept 1 ore from connected drill

### **Connection Logic**
- Drill at `(x,y)` with `outputDirection: EAST` connects to tube at `(x+1, y)` with input side facing WEST
- Connection exists if: tube position matches drill's output position AND tube's input side aligns with drill's output side
- Tube input side is opposite of its `direction` (tube flowing EAST has input on WEST side)

### **System Execution Order (per tick)**
1. **Transport Systems**: Move items through all tubes
2. **Production Systems**: Mine ore in drills, attempt outputs

### **Timing**
- Universal game tick system (e.g., 10 ticks per second)
- All timers count down in ticks
- Mining: 60 ticks (6 seconds), Transport: 30 ticks (3 seconds)

## Explicitly Out of Scope

- **Multiple item types** (only iron ore for now)
- **Smelters/processing** (tubes output into void)
- **Building rotations** after placement
- **Player inventory** 
- **Electricity/power** requirements
- **Item persistence** when buildings destroyed
- **Individual item entities** (using counts only)
- **Complex recipes** or multi-input machines
- **Visual rendering** of items moving
- **Save/load** functionality
- **Building removal/deconstruction** UI