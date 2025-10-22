#!/usr/bin/env node

/**
 * Script to change project name across all configuration files
 * Usage: node scripts/change-project-name.js <new-project-name>
 * Or: npm run change-name <new-project-name>
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Read current package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(
    `${colors.red}Error: Could not read package.json${colors.reset}`,
  );
  process.exit(1);
}

const currentName = packageJson.name;
const newName = process.argv[2];

// Validate input
if (!newName) {
  console.error(
    `${colors.red}Error: New project name is required${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Usage: node scripts/change-project-name.js <new-project-name>${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Example: node scripts/change-project-name.js my-awesome-app${colors.reset}`,
  );
  process.exit(1);
}

// Validate project name format
if (!/^[a-z0-9-]+$/.test(newName)) {
  console.error(
    `${colors.red}Error: Project name must contain only lowercase letters, numbers, and hyphens${colors.reset}`,
  );
  process.exit(1);
}

// Header
console.log(
  `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
);
console.log(
  `${colors.blue}          Project Name Change Script${colors.reset}`,
);
console.log(
  `${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`,
);
console.log('');
console.log(`${colors.yellow}Current name:${colors.reset} ${currentName}`);
console.log(`${colors.yellow}New name:${colors.reset}     ${newName}`);
console.log('');

// Function to update JSON file
function updateJsonFile(filePath, updateFn) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(
        `  ${colors.yellow}○${colors.reset} File not found: ${filePath}`,
      );
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const updated = updateFn(json);

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`  ${colors.green}✓${colors.reset} Updated: ${filePath}`);
      return true;
    } else {
      console.log(
        `  ${colors.yellow}○${colors.reset} No changes needed: ${filePath}`,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `  ${colors.red}✗${colors.reset} Error updating ${filePath}: ${error.message}`,
    );
    return false;
  }
}

// Function to update text file
function updateTextFile(filePath, searchValue, replaceValue, isRegex = false) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(
        `  ${colors.yellow}○${colors.reset} File not found: ${filePath}`,
      );
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    if (isRegex) {
      const regex = new RegExp(searchValue, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replaceValue);
        updated = true;
      }
    } else {
      if (content.includes(searchValue)) {
        content = content.split(searchValue).join(replaceValue);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ${colors.green}✓${colors.reset} Updated: ${filePath}`);
      return true;
    } else {
      console.log(
        `  ${colors.yellow}○${colors.reset} No changes needed: ${filePath}`,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `  ${colors.red}✗${colors.reset} Error updating ${filePath}: ${error.message}`,
    );
    return false;
  }
}

// Ask for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  `${colors.yellow}Are you sure you want to proceed? [y/N]: ${colors.reset}`,
  (answer) => {
    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log(`${colors.red}Aborted.${colors.reset}`);
      process.exit(0);
    }

    console.log('');
    console.log(
      `${colors.green}Starting project name change...${colors.reset}`,
    );
    console.log('');

    // 1. Update package.json
    console.log(`${colors.blue}[1/9]${colors.reset} Updating package.json...`);
    updateJsonFile('package.json', (json) => {
      if (json.name === currentName) {
        json.name = newName;
        return true;
      }
      return false;
    });

    // 2. Update package-lock.json
    console.log('');
    console.log(
      `${colors.blue}[2/9]${colors.reset} Updating package-lock.json...`,
    );
    updateJsonFile('package-lock.json', (json) => {
      let updated = false;
      if (json.name === currentName) {
        json.name = newName;
        updated = true;
      }
      if (
        json.packages &&
        json.packages[''] &&
        json.packages[''].name === currentName
      ) {
        json.packages[''].name = newName;
        updated = true;
      }
      return updated;
    });

    // 3. Update nest-cli.json
    console.log('');
    console.log(`${colors.blue}[3/9]${colors.reset} Updating nest-cli.json...`);
    updateJsonFile('nest-cli.json', (json) => {
      // nest-cli.json typically doesn't have a name field, but check anyway
      if (json.name === currentName) {
        json.name = newName;
        return true;
      }
      return false;
    });

    // 4. Update docker-compose.yml
    console.log('');
    console.log(
      `${colors.blue}[4/9]${colors.reset} Updating docker-compose.yml...`,
    );
    updateTextFile('docker-compose.yml', 'nest-app:', `${newName}:`);
    updateTextFile(
      'docker-compose.yml',
      'container_name: nest-app',
      `container_name: ${newName}`,
    );

    // 5. Update docker-compose.prod.yml
    console.log('');
    console.log(
      `${colors.blue}[5/9]${colors.reset} Updating docker-compose.prod.yml...`,
    );
    updateTextFile('docker-compose.prod.yml', 'nest-app:', `${newName}:`);
    updateTextFile(
      'docker-compose.prod.yml',
      'container_name: nest-app',
      `container_name: ${newName}`,
    );

    // 6. Update .env files
    console.log('');
    console.log(`${colors.blue}[6/9]${colors.reset} Updating .env files...`);
    updateTextFile(
      '.env.example',
      `APP_NAME=${currentName}`,
      `APP_NAME=${newName}`,
    );
    updateTextFile(
      '.env.development',
      `APP_NAME=${currentName}`,
      `APP_NAME=${newName}`,
    );
    updateTextFile(
      '.env.production',
      `APP_NAME=${currentName}`,
      `APP_NAME=${newName}`,
    );
    updateTextFile('.env', `APP_NAME=${currentName}`, `APP_NAME=${newName}`);

    // 7. Update README.md
    console.log('');
    console.log(`${colors.blue}[7/9]${colors.reset} Updating README.md...`);
    updateTextFile('README.md', currentName, newName);

    // 8. Update Dockerfile files
    console.log('');
    console.log(`${colors.blue}[8/9]${colors.reset} Updating Dockerfile...`);
    updateTextFile('Dockerfile', currentName, newName);
    updateTextFile('Dockerfile.dev', currentName, newName);

    // 9. Update tsconfig files (if they contain project name)
    console.log('');
    console.log(
      `${colors.blue}[9/9]${colors.reset} Updating TypeScript config files...`,
    );
    updateTextFile('tsconfig.json', currentName, newName);
    updateTextFile('tsconfig.build.json', currentName, newName);

    // Summary
    console.log('');
    console.log(
      `${colors.green}═══════════════════════════════════════════════════════${colors.reset}`,
    );
    console.log(
      `${colors.green}✓ Project name changed successfully!${colors.reset}`,
    );
    console.log(
      `${colors.green}═══════════════════════════════════════════════════════${colors.reset}`,
    );
    console.log('');
    console.log(`${colors.yellow}Next steps:${colors.reset}`);
    console.log(
      `  1. Review the changes with: ${colors.cyan}git diff${colors.reset}`,
    );
    console.log(
      `  2. Reinstall dependencies: ${colors.cyan}npm install${colors.reset}`,
    );
    console.log(
      `  3. Rebuild Docker containers: ${colors.cyan}docker compose down && docker compose up --build${colors.reset}`,
    );
    console.log('');
    console.log(
      `${colors.yellow}Note:${colors.reset} If you want to rename the project directory, you'll need to do that manually.`,
    );
    console.log('');
  },
);
