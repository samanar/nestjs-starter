# Project Name Change Scripts

This directory contains scripts to change the project name across all configuration files in the NestJS project.

## Available Scripts

### 1. JavaScript Version (Recommended)
**File:** `change-project-name.js`

Cross-platform Node.js script that properly handles JSON files and text replacements.

#### Usage:
```bash
# Using npm script (recommended)
npm run change-name <new-project-name>

# Or directly with Node.js
node scripts/change-project-name.js <new-project-name>

# Example
npm run change-name my-awesome-app
```

### 2. Bash Version
**File:** `change-project-name.sh`

Bash script for Linux/macOS users who prefer shell scripts.

#### Usage:
```bash
# Make executable (if not already)
chmod +x scripts/change-project-name.sh

# Run the script
./scripts/change-project-name.sh <new-project-name>

# Example
./scripts/change-project-name.sh my-awesome-app
```

## What Gets Updated

Both scripts update the project name in the following files:

1. **`package.json`** - The `name` field
2. **`package-lock.json`** - All name references
3. **`nest-cli.json`** - If name field exists
4. **`docker-compose.yml`** - Service name and container name
5. **`docker-compose.prod.yml`** - Service name and container name (if exists)
6. **`.env.example`** - `APP_NAME` variable
7. **`.env.development`** - `APP_NAME` variable (if exists)
8. **`.env.production`** - `APP_NAME` variable (if exists)
9. **`.env`** - `APP_NAME` variable (if exists)
10. **`README.md`** - All occurrences of the old name
11. **`Dockerfile`** - Any references to the old name
12. **`Dockerfile.dev`** - Any references to the old name
13. **`tsconfig.json`** - Any references to the old name
14. **`tsconfig.build.json`** - Any references to the old name

## Naming Rules

The new project name must:
- Contain only lowercase letters (a-z)
- Contain only numbers (0-9)
- Contain only hyphens (-)
- Not contain spaces or special characters

### Valid Examples:
- ✅ `my-app`
- ✅ `awesome-project-2024`
- ✅ `api-server`

### Invalid Examples:
- ❌ `My-App` (uppercase letters)
- ❌ `my_app` (underscore not allowed)
- ❌ `my app` (spaces not allowed)
- ❌ `my@app` (special characters not allowed)

## Before Running

1. **Backup your project** or commit your changes to git
2. Make sure you're in the project root directory
3. Have Node.js installed (for JavaScript version)

## After Running

The script will show you what files were updated. Next steps:

1. **Review changes:**
   ```bash
   git diff
   ```

2. **Reinstall dependencies:**
   ```bash
   npm install
   ```

3. **Rebuild Docker containers:**
   ```bash
   docker compose down
   docker compose up --build
   ```

4. **Update git repository name** (if applicable):
   - On GitHub/GitLab: Go to repository settings and rename
   - Locally: The directory name doesn't change automatically

## Example Output

```
═══════════════════════════════════════════════════════
          Project Name Change Script
═══════════════════════════════════════════════════════

Current name: nest-starter
New name:     my-awesome-app

Are you sure you want to proceed? [y/N]: y

Starting project name change...

[1/9] Updating package.json...
  ✓ Updated: package.json

[2/9] Updating package-lock.json...
  ✓ Updated: package-lock.json

[3/9] Updating nest-cli.json...
  ○ No changes needed: nest-cli.json

[4/9] Updating docker-compose.yml...
  ✓ Updated: docker-compose.yml

...

═══════════════════════════════════════════════════════
✓ Project name changed successfully!
═══════════════════════════════════════════════════════

Next steps:
  1. Review the changes with: git diff
  2. Reinstall dependencies: npm install
  3. Rebuild Docker containers: docker compose down && docker compose up --build
```

## Troubleshooting

### Script not executable
```bash
chmod +x scripts/change-project-name.sh
# or
chmod +x scripts/change-project-name.js
```

### Permission denied
Make sure you have write permissions to the project files.

### Changes not applied
- Verify the current name matches what's in `package.json`
- Check if files exist in your project
- Review the script output for errors

## Manual Steps

The scripts do NOT automatically:
- Rename the project directory
- Update remote git repository settings
- Update deployment configurations
- Update CI/CD pipeline configurations

You'll need to handle these manually if applicable.
