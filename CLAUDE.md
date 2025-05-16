# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Description

We are building a web-based factory and automation game inspired by Factorio. Players can create scalable factories and progressively unlock more powerful technologies.

- 2D top-down view with simple visuals
- Grid-based map with player avatar for exploration and building
- Structures and entities positioned on grid with integer coordinates
- **Note**: This is an exploratory prototype - design and implementation will evolve

## Tech Stack

- TypeScript frontend with strict mode
- bitECS for core architecture/state management
- Phaser.js as game engine (new learning area)
- Webpack for bundling

## Project Structure

Current organization (subject to change as project evolves):
- `frontend/src/game`: Main game code
- `frontend/src/game/ecs`: Entity-Component-System implementation
- `frontend/src/game/terrain`: Map and world generation
- `frontend/src/utils`: Helper utilities

## Build and Development

- `npm run start` - Start webpack dev server (port 8080)
- `npm run build` - Build for production / check for TypeScript errors
- `npm test` - Run tests (not yet configured)

## Code Style Guidelines

- Favor simplicity and "hacky" solutions over premature optimization
- Be cautious about introducing new abstractions/patterns
- Only comment non-obvious or tricky code (focus on WHY, not WHAT)
- Do NOT use verbose, boilerplatey JSDoc style comments 
- Use 2-space indentation
- Follow Phaser.js conventions where applicable

## Collaboration Guidelines

- For non-trivial changes, sketch implementation plan before coding
- Check in frequently, especially when deviating from established patterns
- Use CLI tools for routine tasks to save on inference costs
- Balance between exploration/experimentation and maintaining coherent code

## Resources & References

- [Phaser.js Documentation](https://phaser.io/docs)
- [bitECS GitHub](https://github.com/NateTheGreatt/bitECS)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Factorio](https://factorio.com/) (primary inspiration)
