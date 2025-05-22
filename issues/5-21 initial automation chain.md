## Background

I'd like to start implementing some of the core mechanics of the game. I'm trying to think of the smallest possible set of of mechanics / content that creates a meaningful automation chain. 

Perhaps something like:
1. existence of physical items
2. item transport
3. machines that hold items
4. the ability for machines to transform items from one type into an other.

More concretely:
* 2 item types for now: iron ore, iron plate
* 3 "building" types: mining drill, smelter, and item transport tube

Let's start as small as possible to get something working and then polish it up before adding more complexity. And let's keep it quite minimal / proof-of-concepty.

For item transport, the tube will have one of 4 orientations (up, down, left, right) which determines which way it transports the items. The tube can transport items from a mining drill to a smelter for example.

We've implemented a super bare bones version of the mining drill already, but will need to update it to output a "physical" iron ore item instead of just incrementing the resource counter for the player.

As a first step, let's start by thinking through the data structures, code architecture, and potential state updates we will need for all of this.

For example, state changes occur when a mining drill has its contents modified: add an iron ore (when one is mined) or remove an ore (when it is transported away).

There are a lot of possible details to consider here, e.g. Maybe the mining drill will output the ore straight away in a single game tick if the transport tube is already connected (and not store the ore internally). 

Let me know your thoughts on this potential minimal set of mechanics for a very bare bones "automation chain": e.g. a mining drill mines an ore, transport tubes take the ore from the drill to the smelter, and the smelter process it into an iron plate. 

## Current goal

#### Step 1

Please brainstorm and sketch out a rough draft of the "actions" / "user stories" that we will need. Focus on the very core fundamental bits for now, and just leave a call-out for other secondary details that we will probably need to handle later.

#### Step 2:

After we discuss and refine the user stories / game actions for this initial automation chain, we can begin implemening the data structures and ECS aspects to support these features


#### Later

We can work on rendering, UI, etc. But not yet.

## Additional Misc Notes

* For now, let's completely ignore the folloiwng concepts / mechanics:
    * Needing to power machines with electricity. They will just work "magically"
    * Player inventory. Items will exist only machines or in transport tubes for now.

* Machines will have a max item capacity, and they will stop operating if its maxed out.
* If a transport tube doesnt have a valid output (machine or another tube), any item it has will just sit idle in it, and so on for anything upstream.
