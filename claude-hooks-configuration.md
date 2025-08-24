# Claude Code Hooks Configuration

This document explains the hooks configured for the netpost project.

## Configured Hooks

### 1. Auto-formatting TypeScript/JavaScript Code
- **Event**: `PostToolUse`
- **Triggers**: After editing `.ts`, `.tsx`, `.js`, `.jsx` files
- **Action**: Runs Prettier for formatting and ESLint for code quality fixes
- **Command**: `npx prettier --write $CLAUDE_FILE_PATHS && npx eslint --fix $CLAUDE_FILE_PATHS`

### 2. Automatic Testing
- **Event**: `PostToolUse`
- **Triggers**: After editing files in backend, dashboard, or chrome-extension source directories
- **Action**: Runs the test suite in the background
- **Command**: `npm test`
- **Note**: Runs in background so it doesn't block Claude's workflow

### 3. Security Validation
- **Event**: `PreToolUse`
- **Triggers**: Before any Edit, MultiEdit, or Write operations
- **Action**: Prevents editing sensitive files like `.env`, `package-lock.json`, `.git/`, `node_modules/`
- **Purpose**: Protects critical files from accidental modification

### 4. Git Commit Automation
- **Event**: `Stop`
- **Triggers**: When Claude Code session ends
- **Action**: Automatically stages all changes and creates a commit with timestamp
- **Command**: `git add -A && git commit -m "Auto-commit: $(date)"`

### 5. Notification System
- **Event**: `Notification`
- **Triggers**: When Claude needs user input
- **Action**: Shows desktop notification
- **Command**: `notify-send 'Claude Code' 'Awaiting input'`

## Project-Specific Adaptations

The hooks have been adapted from Python-based examples to work with your TypeScript/JavaScript project:

- **Formatting**: Uses Prettier + ESLint instead of Black + Ruff
- **Testing**: Uses `npm test` instead of `pytest`
- **File Patterns**: Targets `.ts`, `.tsx`, `.js`, `.jsx` files
- **Project Structure**: Recognizes your backend, dashboard, and chrome-extension directories

## Installation

The hooks are configured in `.claude/settings.json` in the project root and will automatically apply to all Claude Code sessions in this project.

## Requirements

Make sure you have these tools installed:
- `prettier` (for code formatting)
- `eslint` (for linting)
- `notify-send` (for desktop notifications, usually pre-installed on Linux)

You can install the formatting tools with:
```bash
npm install --save-dev prettier eslint
```