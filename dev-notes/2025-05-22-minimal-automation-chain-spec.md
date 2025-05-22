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

## ECS Implementation Details

### **Components**
- `Position`: Grid coordinates (x, y)
- `MiningDrill`: Output direction, iron ore count (max 10), mining timer
- `TransportTube`: Flow direction, iron ore count (max 5), transport timer
- `Timer`: Relative tick counter for building-specific timing

### **Systems**
1. `TimerSystem`: Updates all relative timers based on global tick counter
2. `TransportSystem`: Moves items through tubes, handles tube-to-void output
3. `MiningSystem`: Mines ore and attempts output to connected tubes
4. `ConnectionSystem`: Dynamically calculates drill-to-tube connections

### **System Execution Order**
1. `TimerSystem` (updates all timers)
2. `TransportSystem` (process all tube movements)
3. `MiningSystem` (mine ore, attempt outputs)
4. `ConnectionSystem` (calculate connections for next tick)

### **Entity Structure**
- **Mining Drill Entity**: Position + MiningDrill + Timer components
- **Transport Tube Entity**: Position + TransportTube + Timer components
- Global tick counter managed by game loop, not stored on entities

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
- **Generic Inventory component** (item counts stored directly on buildings)
- **Connection caching/optimization** (dynamic calculation each tick for simplicity)
- **Advanced timing optimizations** (straightforward timer decrements)
- **Multi-entity building structures** (each building is single entity)

## ECS Pseudocode Implementation

### **Components**

```typescript
Position {
  x: number
  y: number
}

MiningDrill {
  outputDirection: Direction  // NORTH | SOUTH | EAST | WEST
  ironOreCount: number        // current storage (0-10)
  maxCapacity: number = 10
  miningInterval: number = 60
}

TransportTube {
  direction: Direction        // flow direction  
  ironOreCount: number        // current storage (0-5)
  maxCapacity: number = 5
  transportInterval: number = 30
}

Timer {
  ticksRemaining: number      // countdown to next action
}
```

### **Systems**

```typescript
// Decrements all timers
TimerSystem(entities) {
  for each entity with Timer {
    if (timer.ticksRemaining > 0) {
      timer.ticksRemaining--
    }
  }
}

// Moves items through tubes
TransportSystem(entities) {
  for each entity with (TransportTube, Timer) {
    if (timer.ticksRemaining == 0 && tube.ironOreCount > 0) {
      tube.ironOreCount--  // output to void
      timer.ticksRemaining = tube.transportInterval
    }
  }
}

// Mines ore AND handles drill outputs (keeping it simple)
MiningSystem(entities) {
  for each entity with (MiningDrill, Timer, Position) {
    // Mine when timer expires and storage not full
    if (timer.ticksRemaining == 0 && drill.ironOreCount < drill.maxCapacity) {
      drill.ironOreCount++
      timer.ticksRemaining = drill.miningInterval
    }
    
    // Attempt output every tick (spec says "each tick")
    if (drill.ironOreCount > 0) {
      targetTube = findConnectedTube(position, drill.outputDirection, entities)
      if (targetTube && targetTube.ironOreCount < targetTube.maxCapacity) {
        drill.ironOreCount--
        targetTube.ironOreCount++
      }
    }
  }
}
```

### **Game Loop**

```typescript
gameTick(entities) {
  TimerSystem(entities)
  TransportSystem(entities)  // spec says transport first
  MiningSystem(entities)     // then production
}
```

### **Entity Creation**

```typescript
createMiningDrill(x, y, outputDir) {
  entity = createEntity()
  addComponent(entity, Position{x, y})
  addComponent(entity, MiningDrill{outputDir, 0, 10, 60})
  addComponent(entity, Timer{60})  // start with full interval
}

createTransportTube(x, y, direction) {
  entity = createEntity()
  addComponent(entity, Position{x, y}) 
  addComponent(entity, TransportTube{direction, 0, 5, 30})
  addComponent(entity, Timer{30})  // start with full interval
}
```