import { world } from '../game/ecs/world';
import { modifyPlayerResources, setPlayerResources } from '../game/ecs/systems/resourceSystem';

export function initDevTools(): void {
  // Throwaway global functions for manipulating resources
  (window as any).setIronOre = (amount: number) => {
    setPlayerResources(world, { ironOre: amount });
    console.log(`Set iron ore to ${amount}`);
  };

  (window as any).addIronOre = (amount: number) => {
    modifyPlayerResources(world, { ironOre: amount });
    console.log(`Added ${amount} iron ore`);
  };

  console.log('Dev tools initialized. Available console functions:');
  console.log('  window.setIronOre(amount) - Set iron ore to specific amount');
  console.log('  window.addIronOre(amount) - Add/subtract iron ore (negative values subtract)');
}
