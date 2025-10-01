# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Trello Power-Up template project - a client-side JavaScript application that extends Trello's functionality through their Power-Up framework. It serves as a reference implementation demonstrating all major Power-Up capabilities.

## Architecture

### Client-Side Only Structure

This is a purely static website with no build process. All files are served directly:
- HTML files at root define UI surfaces (modal, board-bar, settings, etc.)
- JavaScript in [js/](js/) directory handles Power-Up initialization and capabilities
- No compilation, bundling, or build step required
- Hosted on GitHub Pages (gh-pages branch)

### Power-Up Entry Point

The Power-Up loads via [index.html](index.html) in a hidden iframe when enabled on a Trello board. This loads:
1. Trello's Power-Up SDK: `https://p.trellocdn.com/power-up.min.js`
2. Main client logic: [js/client.js](js/client.js)

### Core Architecture Pattern

[js/client.js](js/client.js) calls `TrelloPowerUp.initialize()` with capability handlers:
- **UI Capabilities**: board-buttons, card-buttons, card-badges, show-settings
- **Data Capabilities**: attachment-sections, attachment-thumbnail, format-url, card-from-url
- **Auth Capabilities**: authorization-status, show-authorization

Each capability returns configuration objects or functions that Trello invokes at appropriate times.

### Iframe-Based UI Components

When Power-Up opens popups, modals, or board bars, separate HTML files load in iframes:
- [modal.html](modal.html) / [js/modal.js](js/modal.js) - Full-screen modal dialogs
- [board-bar.html](board-bar.html) / [js/board-bar.js](js/board-bar.js) - Top board banner
- [settings.html](settings.html) / [js/settings.js](js/settings.js) - Settings popup
- [section.html](section.html) / [js/section.js](js/section.js) - Attachment sections
- [authorize.html](authorize.html) - OAuth authorization flow

Each iframe JavaScript file:
1. Gets iframe context via `TrelloPowerUp.iframe()`
2. Implements `t.render()` for reactive updates
3. Uses `t.get()`/`t.set()` for data persistence
4. Can access arguments via `t.arg('name')`

### Data Storage Model

Power-Ups store data using `t.set(scope, visibility, key, value)`:
- **Scopes**: organization, board, card, member (4096 chars per scope/visibility)
- **Visibility**: 'shared' (all users) or 'private' (current user only)
- Example: `t.set('board', 'shared', 'fruit', 'apple')` stores board-level shared data
- Retrieve with: `t.get('board', 'shared', 'fruit')` or `t.getAll()`

### Trello API Access

The Power-Up SDK provides direct access to Trello data without REST API:
- `t.board('id', 'name', 'url', 'members')` - Current board info
- `t.lists('id', 'name', 'cards')` - All lists on board
- `t.card('id', 'name', 'desc', 'due', 'members', 'labels')` - Current card (context-dependent)
- `t.cards(...)` - All cards on board
- `t.member('id', 'fullName', 'username')` - Current user

For full REST API access, implement authorization-status and show-authorization capabilities. User must authorize via OAuth, then store token with `t.set('member', 'private', 'token', tokenValue)`.

## Development Workflow

### No Build Commands

This project has no build, test, or lint commands. Development is direct file editing.

### Testing Changes

1. Edit files locally
2. Commit and push to gh-pages branch
3. Changes are immediately live at `https://trello.github.io/power-up-template/index.html`
4. Refresh Trello board to see updates (Power-Up reloads automatically)

### Adding Power-Up to Trello

1. Go to https://trello.com/power-ups/admin
2. Create new Power-Up and enter connector URL: `https://trello.github.io/power-up-template/index.html`
3. Enable on a Trello team (requires admin access)
4. Power-Up appears in board's Power-Ups menu under "Custom"

### Key Files to Modify

- [js/client.js](js/client.js) - Add/modify capabilities, change initialization logic
- Individual iframe JS files - Customize specific UI surfaces
- HTML files - Update markup for popups, modals, settings
- [css/](css/) - Styling for iframe content

## Important Constraints

- **Context Availability**: Some data only available in certain contexts (e.g., `t.card()` only works in card-badges, card-buttons, attachment-sections, not in board-buttons or show-settings)
- **Storage Limits**: 4096 chars per scope/visibility combination
- **Promises**: All async operations use Bluebird Promises via `TrelloPowerUp.Promise`
- **Security**: Store sensitive data (tokens, API keys) at 'member' scope with 'private' visibility
- **URL Signing**: Use `t.signUrl()` for iframe URLs that need to pass arguments securely
