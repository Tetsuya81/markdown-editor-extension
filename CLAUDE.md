# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension that provides a macOS-styled Markdown editor. It's a simple, self-contained extension with no build process or external dependencies.

## Development Commands

Since this is a vanilla JavaScript Chrome extension, there are no build or test commands. Development workflow:

1. Load the extension in Chrome developer mode:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this directory

2. After making changes:
   - Click the "Reload" button in Chrome extensions page
   - Test the extension by clicking its icon in the toolbar

## Architecture

The extension consists of three main components:

1. **popup.html**: The UI that appears when users click the extension icon
2. **popup.js**: Contains the `MarkdownEditor` class that handles all functionality:
   - Theme management (auto/light/dark modes)
   - Auto-save/load using Chrome Storage API
   - Copy to clipboard and clear operations
   - Keyboard shortcuts (Cmd/Ctrl+Shift+U/O/Y, ESC)
   - Shortcut hints display when holding Cmd/Ctrl key
3. **styles.css**: macOS-inspired styling with CSS variables for theming

Key implementation details:
- Uses Chrome Storage API to persist markdown text and theme preference
- No external dependencies - pure vanilla JavaScript
- Implements visual feedback through notifications and button animations
- Supports system theme preference detection