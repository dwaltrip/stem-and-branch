# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Description

We are building a web-based factory and automation game. It will be 2d and have a top-down camera with simple visuals.

We are trying out Phaser.js to see if it can do the heavy lifting for the game.

The game will be grid based with each player having a little avatar they can move around to build and explore the map.

The game will be heavily inspired by factorio. Players can create powerful, highly scalable factories.

## Build and Development Commands
- `npm run start` - Start webpack dev server (port 8080)
- `npm run build` - Build for production / check for TypeScript errors
- `npm test` - Run tests (currently not configured)

## Code Style Guidelines
- TypeScript with strict mode enabled
- Use ES2015+ features with ESNext module format
- Maintain clear separation between terrain generation utilities and game rendering
- Use PascalCase for enums, interfaces, and classes
- Use camelCase for variables, functions, and methods
- Use UPPER_CASE for constants and enum values
- Use explicit type annotations for function parameters and return types
- Prefer interfaces for object type definitions
- Use enums for related constant values
- Organize code into appropriate modules under src/ directory
- Follow Phaser.js conventions for game scene management
- Use proper indentation (2 spaces)
- Include JSDoc comments for exported functions/interfaces
