# Lifegrid Issues

This directory contains detailed issue descriptions for planned features and improvements.

## Issue List

### High Priority

1. **[frontend: Fix Mobile Keyboard Input for TagInput Component](./frontend-fix-mobile-keyboard-input-taginput.md)**
   - Fix mobile keyboard issues preventing tag creation on food/fitness pages

2. **[frontend: Increase Font Sizes and Improve Typography Scale](./frontend-increase-font-sizes-typography.md)**
   - Improve readability across the app with larger fonts

### Medium Priority

3. **[frontend: Improve Add Entry Button Styling](./frontend-improve-add-entry-button-styling.md)**
   - Make "Add entry" buttons more visible and actionable

4. **[backend: Create Database Schema for Friends System](./backend-create-friends-database-schema.md)**
   - Set up database tables for friends and privacy settings

5. **[frontend: Build Friends Management UI](./frontend-build-friends-management-ui.md)**
   - Create Friends page for managing friend relationships

6. **[frontend: Implement Privacy Settings UI](./frontend-implement-privacy-settings-ui.md)**
   - Add privacy toggles to Settings page

7. **[frontend+backend: Create Leaderboard Feature](./frontend-backend-create-leaderboard-feature.md)**
   - Build leaderboard showing friends' public fitness/analytics data

8. **[backend: Create Theme System Database Schema](./backend-create-theme-system-database-schema.md)**
   - Set up database tables for theme system

9. **[frontend: Implement Theme Selection UI](./frontend-implement-theme-selection-ui.md)**
   - Add theme picker to Settings page

10. **[frontend: General UI/UX Improvements and Bug Fixes](./frontend-general-ui-ux-improvements-bug-fixes.md)**
    - Address various UI/UX issues and polish the app

### Low Priority

11. **[frontend: Implement Friend Schedule Grid View Feature](./frontend-implement-friend-schedule-grid-view.md)**
    - Allow viewing friends' public schedules (needs discussion)

12. **[frontend: Optimize Theme Loading and Caching](./frontend-optimize-theme-loading-caching.md)**
    - Optimize theme loading performance

## Issue Naming Convention

Issues are named using the format: `<where>: <Task name>`

- `frontend:` - Changes to frontend code
- `backend:` - Changes to backend/database
- `frontend+backend:` - Changes requiring both frontend and backend work
- `misc:` - Other changes (documentation, tooling, etc.)

## How to Use These Issues

1. Each issue file contains:
   - Problem description
   - Proposed solution
   - UX considerations
   - Acceptance criteria
   - Implementation ideas
   - Files to modify/create
   - Related issues

2. These can be:
   - Converted to GitHub issues
   - Used as development guides
   - Referenced in pull requests
   - Used for project planning

3. When starting work on an issue:
   - Read the full issue description
   - Check prerequisites and related issues
   - Update the issue with progress
   - Mark acceptance criteria as completed

## Issue Dependencies

### Friends System
- `backend: Create Database Schema for Friends System` → Required first
- `frontend: Build Friends Management UI` → Depends on backend schema
- `frontend: Implement Privacy Settings UI` → Depends on backend schema
- `frontend+backend: Create Leaderboard Feature` → Depends on friends system
- `frontend: Implement Friend Schedule Grid View Feature` → Depends on friends system

### Theme System
- `backend: Create Theme System Database Schema` → Required first
- `frontend: Implement Theme Selection UI` → Depends on backend schema
- `frontend: Optimize Theme Loading and Caching` → Depends on theme UI

### UI Improvements
- `frontend: Fix Mobile Keyboard Input for TagInput Component` → Can be done independently
- `frontend: Improve Add Entry Button Styling` → Can be done independently
- `frontend: Increase Font Sizes and Improve Typography Scale` → Can be done independently
- `frontend: General UI/UX Improvements and Bug Fixes` → Can be done independently

## Contributing

When creating new issues:
1. Use the naming convention: `<where>: <Task name>`
2. Include all sections (Problem, Solution, UX, Acceptance Criteria, etc.)
3. List related issues and dependencies
4. Be specific about files to modify
5. Keep issues focused and mergeable

