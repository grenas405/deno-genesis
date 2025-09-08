# Learning Log

A collection of technical insights and discoveries, no matter how small.

## September 7, 2025

### Static File Middleware Security

**Topic**: Static file middleware necessity for security

**What I learned**: Static file middleware is not just a convenience feature - it's a security necessity. A simple file handler without proper middleware creates serious vulnerabilities because it lacks:

- **Directory traversal protection** - Without checks for `../` patterns, attackers can access files outside the intended directory
- **File extension allowlisting** - Prevents serving sensitive files like `.env`, `.git`, or system configuration files  
- **Hidden file protection** - Blocks access to dotfiles that often contain sensitive information
- **MIME type validation** - Prevents content-type confusion attacks

The middleware acts as a security layer that validates and sanitizes requests before serving files from the filesystem.

**Key insight**: Never serve files directly without security middleware - it's essentially leaving your filesystem exposed to traversal attacks.

---

### File Organization and Naming Conventions

**Topic**: Learning log placement in project structure

**What I learned**: Based on the TODO2.md directory numbering system, a learning log would most logically fit under:

- **`03-development/`** - Since it's part of the daily development process and personal knowledge building
- **`13-reference/`** - As it serves as a quick reference for concepts learned over time

The learning log is development-focused documentation that captures incremental knowledge gains during the coding process. It's more of a personal development tool than formal project documentation.

**Key insight**: Personal learning documentation bridges development process (`03-`) and reference material (`13-`), but leans toward development since it's created during active coding/learning sessions.

---

## September 7, 2025

### Static File Middleware Security

**Topic**: Static file middleware necessity for security

**What I learned**: Static file middleware is not just a convenience feature - it's a security necessity. A simple file handler without proper middleware creates serious vulnerabilities because it lacks:

- **Directory traversal protection** - Without checks for `../` patterns, attackers can access files outside the intended directory
- **File extension allowlisting** - Prevents serving sensitive files like `.env`, `.git`, or system configuration files  
- **Hidden file protection** - Blocks access to dotfiles that often contain sensitive information
- **MIME type validation** - Prevents content-type confusion attacks

The middleware acts as a security layer that validates and sanitizes requests before serving files from the filesystem.

**Key insight**: Never serve files directly without security middleware - it's essentially leaving your filesystem exposed to traversal attacks.

---