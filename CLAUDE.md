# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands
- `npm run build` - Build for production
- `npm run start` - Start webpack dev server (port 8080)
- `npm test` - Run tests (currently not configured)
- `bash ./tools/run-dev.sh` - Run simple HTTP server (port 8000)

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
