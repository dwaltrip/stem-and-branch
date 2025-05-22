*Me:*

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

----------------------------
*Claude:*

I'll brainstorm the core actions/user stories for this minimal automation chain. This is a great approach to start small and build up!

Core User Stories / Actions

Mining Drill Actions

- Mine ore: Periodically generate one iron ore item (on timer/tick)
- Store internally: Hold iron ore in internal buffer (capacity limit: e.g., 10 items)
- Output ore: Transfer iron ore to connected transport tube when possible
- Block when full: Stop mining when internal storage is at capacity
- Block when output blocked: Can't output if transport tube is full/disconnected

Transport Tube Actions

- Receive item: Accept iron ore from mining drill or upstream tube
- Move item: Transport item along tube direction (up/down/left/right)
- Output item: Transfer item to connected smelter or downstream tube
- Handle blockage: Stop accepting new items when output is blocked
- Idle when disconnected: Hold item indefinitely if no valid output connection

Smelter Actions

- Receive ore: Accept iron ore from transport tube
- Process ore: Transform iron ore → iron plate (on timer, e.g., 3 seconds)
- Store plates: Hold iron plates in internal buffer (capacity limit)
- Output plates: Transfer iron plates to connected transport tube
- Block when full: Stop processing when output buffer is full
- Block when input full: Can't accept new ore when input buffer is full

System-Level Actions

- Connection detection: Determine valid input/output connections between buildings
- Item flow: Move items between connected buildings each game tick
- Capacity checking: Enforce storage limits on all machines
- State synchronization: Update all machine states consistently each tick

Secondary Details (For Later)

- Processing speeds: Different machines work at different rates
- Visual feedback: Item sprites moving along tubes, machine animations
- Building placement: Rotating tubes, connecting to specific machine sides
- Multiple slots: Separate input/output buffers, multiple item types per machine
- Recipe complexity: Machines requiring multiple input types
- Item destruction: What happens to items in disconnected tubes when buildings are removed
- Save/load: Persisting item states and machine contents

Key Design Questions

1. Item representation: Individual item entities vs. item counts in buffers?
2. Connection system: How do we determine which buildings connect to which?
3. Tick frequency: How often do we update machine states and item movement?
4. Tube capacity: Do tubes hold one item or multiple items in sequence?

This gives us a solid foundation to start implementing the ECS components and systems. What are your thoughts on this breakdown?
Any core actions I'm missing or details you'd like to adjust before we move to Step 2?

----------------------------
*Me:*

I'd like to break down this work into small digestible chunks. I'm thinking lets focus on just the mining drill and the ability 
  to output into a single tube for now. For both the drill and tube, lets just use "counts" (by item type) instead of actual 
  entities. We already have a bare bones mining drill, but it doesn't have internal capacity yet. Can you go into a bit more detail
   on a very minimal set of actions / mechanics for just the mining drill and transport tube?

----------------------------
*Claude:*

Perfect! Let's narrow the focus to just mining drill + single tube with item counts. Here's a minimal set of actions:

Mining Drill Actions

Core State

- ironOreCount: number (internal storage, max capacity e.g. 10)
- miningTimer: number (time until next ore is mined)
- outputDirection: Direction (which side connects to tube)

Actions

- Mine: Every X seconds, if ironOreCount < maxCapacity, increment ironOreCount by 1
- Attempt Output: Each tick, if ironOreCount > 0 and connected tube can accept, transfer 1 ore to tube
- Block Mining: When ironOreCount >= maxCapacity, stop the mining timer

Transport Tube Actions

Core State

- ironOreCount: number (items currently in tube, max capacity e.g. 5)
- direction: Direction (up/down/left/right - which way items flow)
- outputTimer: number (time until next item moves out)

Actions

- Accept Input: If ironOreCount < maxCapacity, accept 1 ore from connected drill
- Move Item: Every Y seconds, if ironOreCount > 0, attempt to output 1 ore in direction
- Block Input: When ironOreCount >= maxCapacity, refuse new items from drill

Connection Logic

- Drill outputs in its outputDirection
- If a tube exists at that grid position and tube's input side aligns, they're connected
- Tube outputs in its direction (for now, just into void/ground until we add smelter)

Key Simplifications

- Items are just counts, not individual entities
- One item type (iron ore)
- Tube empties into void for now
- No complex timing - simple tick-based updates
- Fixed capacities and processing speeds

This gives us a working "drill mines → tube transports → items disappear" chain to validate the basic mechanics. Sound good for
this first chunk?

----------------------------
*Me:*

this is good! anything else come to mind that we need to hash out before moving on?

----------------------------
*Claude:*

A few quick implementation details to clarify:

Grid Positioning & Connections

- Building placement: Are drill/tube at integer grid coordinates (x, y)?
- Direction mapping: How do we determine if drill's output aligns with tube's input? (e.g., drill facing EAST connects to tube at
position drill.x+1, drill.y with tube facing EAST?)

Timing & Updates

- System execution order: Should we update drills first, then tubes? Or does order matter for our simple case?
- Timer units: Game ticks, milliseconds, or seconds for mining/transport timers?

ECS Integration

- Component structure: Do we add ItemStorage and Transport components to existing buildings, or create new component types?
- Existing mining drill: How much of the current drill implementation do we keep vs. replace?

Edge Cases

- Building removal: What happens to items in drill/tube when building is destroyed?
- Direction changes: Can tube direction be rotated after placement, and what happens to items inside?

Most of these we can figure out as we implement, but the grid positioning/connection logic might be worth sketching out since it
affects how we structure the data.

Ready to move to implementation, or want to nail down any of these first?

----------------------------
*Me:*

* All buildings / entities wll be 1x1 for now, and they exist on our map at specific tile grid positions given by integer coords (x,y).
* The tube needs to have its input side facing the output side of the drill. Otherwise, the drill doesn't have a valid output.
* For execution order, lets do item movements in the tubes before any machine outputs.
* I think all timing should be based off a universal game "tick" right? like this is a simulation and it proceed tick by tick at a certain wall clock rate when running normally. what do you think?
* We can discuss the existing mining drill implementaiton in a bit after we finish planning the game actions and state for the first part
* We can discuss the actual ECS details in a bit when we are done talking through the these initial game mechanics and what state / attributes each will need (on a more pseudo-code / abstract level, like you just did above)
* No rotations after placement for now.
* Lets keep it simple and not worry about any items in building if it is removed / destroyed. they can just disappear for now.

Please update our spec of the minimal game actions and core state, and then at the end list out the things that we have explicitly decided to keep out of scope (at least for now).

----------------------------
*Claude:*

Thinking…

  The user wants me to update the spec based on their clarifications:

  1. All buildings are 1x1 on integer grid coords (x,y)
  2. Tube input side must face drill output side for connection
  3. Execution order: tube movements first, then machine outputs
  4. Universal game tick system for timing
  5. No rotations after placement
  6. Items disappear if building is destroyed

  Let me update the spec with these details and create a clean version.

⏺ Updated Minimal Automation Chain Spec

  Mining Drill

  Core State

  - position: {x: number, y: number} (grid coordinates)
  - outputDirection: Direction (NORTH/SOUTH/EAST/WEST - which side outputs)
  - ironOreCount: number (internal storage, max capacity: 10)
  - miningTicksRemaining: number (ticks until next ore is mined)

  Actions

  - Mine: Every 60 ticks, if ironOreCount < 10, increment ironOreCount by 1, reset timer
  - Attempt Output: Each tick, if ironOreCount > 0 and has valid tube connection, transfer 1 ore to tube
  - Block Mining: When ironOreCount >= 10, pause mining timer

  Transport Tube

  Core State

  - position: {x: number, y: number} (grid coordinates)
  - direction: Direction (NORTH/SOUTH/EAST/WEST - which way items flow)
  - ironOreCount: number (items in tube, max capacity: 5)
  - transportTicksRemaining: number (ticks until next item moves out)

  Actions

  - Move Item: Every 30 ticks, if ironOreCount > 0, move 1 ore out (into void for now), reset timer
  - Accept Input: If ironOreCount < 5, accept 1 ore from connected drill

  Connection Logic

  - Drill at (x,y) with outputDirection: EAST connects to tube at (x+1, y) with input side facing WEST
  - Connection exists if: tube position matches drill's output position AND tube's input side aligns with drill's output side
  - Tube input side is opposite of its direction (tube flowing EAST has input on WEST side)

  System Execution Order (per tick)

  1. Transport Systems: Move items through all tubes
  2. Production Systems: Mine ore in drills, attempt outputs

  Timing

  - Universal game tick system (e.g., 10 ticks per second)
  - All timers count down in ticks
  - Mining: 60 ticks (6 seconds), Transport: 30 ticks (3 seconds)

  Explicitly Out of Scope

  - Multiple item types (only iron ore for now)
  - Smelters/processing (tubes output into void)
  - Building rotations after placement
  - Player inventory
  - Electricity/power requirements
  - Item persistence when buildings destroyed
  - Individual item entities (using counts only)
  - Complex recipes or multi-input machines
  - Visual rendering of items moving
  - Save/load functionality
  - Building removal/deconstruction UI

  This gives us a very focused scope for implementation. Ready to move to the ECS component design?

----------------------------
*Me:*

can you save this minimal spec in a file in dev notes? prefix it with the date in yyyy-mm-dd format

----------------------------
*Claude:*

Write(file_path: dev-notes/2025-05-22-minimal-automation-chain-spec.md)…
