Overview of bitECS, version 0.3

# Key Concepts of BitECS

BitECS is a high-performance Entity Component System (ECS) library for JavaScript. Here's a summary of its core concepts:

## 1. World
A World represents a collection of entities and their associated components. Worlds don't store component data directly, but maintain relationships between entities and components. Multiple worlds can be created as needed.

## 2. Entity
An entity in BitECS is simply an integer that acts as a pointer. Components are associated with entities, and entities are accessed through queries. The system provides methods to add and remove entities from worlds.

## 3. Component
Components store pure data and are added to entities to give them state. BitECS uses a Structure of Arrays (SoA) approach for storing component data, which enables high-performance iteration. Components can be defined with various data types, including references to other entities.

## 4. Component Proxy
Component proxies provide a way to interact with component data using regular objects while maintaining high performance. This creates cleaner syntax and better interoperability with other libraries, though with some boilerplate and a slight performance cost. Proxy instances must be reused for best performance.

## 5. Query
Queries are defined with components and used to obtain specific sets of entities from a world. BitECS offers features like:
- Basic queries to find entities with specific components
- `Not` modifier to find entities without certain components
- `Changed` modifier to detect entities whose components have been modified
- `enterQuery` and `exitQuery` to capture entities that begin or cease to match a query

## 6. System
Systems are functions run against a world to update component states of entities. They typically use queries to obtain relevant entities and perform operations on their component data. Systems can be composed into pipelines using the `pipe` function.

## 7. Serialization
BitECS provides built-in, performant serialization capabilities. You can serialize any subset of data with high efficiency:
- Serialize entire worlds or specific entities
- Target specific components and properties
- Use queries to serialize only entities matching certain criteria
- Track and serialize only changed components

BitECS offers three deserialization modes:
- REPLACE: Overwrites entity data or creates new entities
- APPEND: Only creates new entities, never overwrites existing data
- MAP: Similar to REPLACE but assigns local entity IDs to maintain relationships

The library emphasizes performance through its Structure of Arrays approach and provides a flexible API for building complex entity-component systems in JavaScript.
