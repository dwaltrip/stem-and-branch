# Factory Automation Game TODOs

## Core Architecture Improvements

1. **Scene Management**
   - Create separate scenes (LoadingScene, MenuScene, GameScene)
   - Implement scene transitions
   - Add proper game state management between scenes

2. **Asset Management**
   - Create a dedicated preloader scene
   - Add loading progress bar
   - Implement proper asset manifest

3. **Object-Oriented Structure**
   - Extract Player class from MainScene
   - Create Factory entity classes
   - Create Building and Item classes

4. **Physics**
   - Improve collision detection using Phaser's physics system
   - Add proper collision handling for buildings and terrain

5. **State Management**
   - Create a game state manager
   - Implement save/load functionality
   - Add game progression tracking

6. **UI Components**
   - Create a separate UI scene overlay
   - Implement inventory UI
   - Add building UI components
   - Create resource display

## Completed Improvements

1. **Performance Optimization** ✓
   - Replaced individual rectangle objects with Phaser's TileMap system
   - Added sprite management for terrain rendering
   - Implemented camera culling

2. **Input Handling** ✓
   - Created InputManager class with action mapping
   - Added support for customizable key bindings
   - Implemented debug UI for input detection

## Next Steps

For the next session, we should focus on implementing the Player and Building classes as separate entities. This will help establish a good foundation for the factory automation mechanics.