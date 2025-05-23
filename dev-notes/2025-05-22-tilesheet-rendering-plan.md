# Tilesheet and Rendering Architecture Plan

*2025-05-22*

## Overview
Planning improved tilesheet system for terrain and buildings with visual variants support.

## Key Decisions

### Separate Tilesheets
- **Terrain tilesheet**: grass, stone, water variants
- **Building tilesheet**: drill, belt, assembler (grid-aligned, transparent backgrounds)

### Visual Variants
- Multiple tiles for same abstract type (e.g., 3 grass variants)
- Deterministic selection using position hash: `(x * 73 + y * 31) % variants.length`
- Maintains consistency across renders

### Rendering Approach
- **Terrain**: Phaser Tilemap system (automatic culling, batched rendering)
- **Buildings**: Phaser Sprite Groups (pooling, management)
- Buildings render on top of terrain with transparent backgrounds

## File Structure
```
src/game/
  assets/
    terrain-tiles.png
    building-tiles.png
  rendering/
    TileRenderer.ts      // manages tilemap + building sprite groups
    TileManager.ts       // handles tilesheet metadata + tile ID mapping
  world/
    MapData.ts          // abstract terrain types
```

## Implementation Sketch

### TileManager.ts
```typescript
class TileManager {
  TERRAIN_TILES = {
    grass: [0, 1, 2],    // tile IDs for variants
    stone: [3],
    water: [4, 5]
  }
  BUILDING_TILES = {
    drill: 0,
    belt: 1,
    assembler: 2
  }
  
  createTilemap(mapData: TerrainType[][]) {
    const tileIds = mapData.map((row, y) => 
      row.map((terrain, x) => this.getTerrainTileId(terrain, x, y))
    )
    
    const map = scene.make.tilemap({ data: tileIds, tileWidth: 32, tileHeight: 32 })
    const tileset = map.addTilesetImage('terrain-tiles')
    return map.createLayer(0, tileset)
  }
  
  getTerrainTileId(type: TerrainType, x: number, y: number) {
    const variants = this.TERRAIN_TILES[type]
    const hash = (x * 73 + y * 31) % variants.length
    return variants[hash]
  }
}
```

### TileRenderer.ts
```typescript
class TileRenderer {
  buildingGroup: Phaser.GameObjects.Group
  
  init() {
    this.buildingGroup = scene.add.group()
  }
  
  renderBuildings() {
    const buildings = world.with(Position, Building)
    buildings.forEach(entity => {
      const pos = Position.get(entity)
      const building = Building.get(entity)
      
      if (!building.sprite) {
        building.sprite = scene.add.sprite(pos.x * tileSize, pos.y * tileSize, 'building-sheet')
        building.sprite.setFrame(BUILDING_TILES[building.type])
        this.buildingGroup.add(building.sprite)
      }
    })
  }
}
```

## Game Flow
1. Generate map data with Perlin noise (TerrainType[][])
2. Create Phaser tilemap from terrain data with variants
3. Render buildings as sprites on top with transparent backgrounds
4. Phaser handles culling and batching automatically

## Benefits
- Efficient rendering with Phaser built-ins
- Visual variety without complex map data
- Clean separation between terrain and buildings
- Grid-aligned entities for game logic simplicity
- Expandable for future features

## Next Steps
- Review current rendering code
- Implement tilesheet separation
- Add variant selection system
- Update asset loading