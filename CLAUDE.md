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

- Error on the side of simplicity / "hacky". It's easier to polish up later when we have more confidence about the implementation.
- Be very judicious about introducing new abstractions / patterns, as poor or too many abstractions can severly hamstring a codebase.

- TypeScript with strict mode enabled
- Dont excessively comment
    - No comments that basically just repeat what the line of code says!
    - Only provide comments for non-obvious or particularly tricky pieces
    - Generally, focus WHY the choice was made, not on WHAT the code does

- Organize code into appropriate modules under src/ directory
- Follow Phaser.js conventions
- Use proper indentation (2 spaces)

## Collaboration Guidelines and Coding Strategy

- In general, lean towards asking for clarificaiton / guidance / confirmation more often than not
- When making non-trivial changes, sketch out a skeleton of what the implementation will look like and confirm with me before writing any code
- Check that you are sticking to the plan as you make edits. If the plan needs to be updated, lets quickly discuss before proceeding (e.g. check with me)
- When planning larger pieces of work, break the work into smaller chunks that we can check out and make sure are good and sensible, to catch problems earlier
