#!/bin/bash

# Script to change project name across all configuration files
# Usage: ./scripts/change-project-name.sh <new-project-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the current project name from package.json
CURRENT_NAME=$(node -p "require('./package.json').name")

# Check if new name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: New project name is required${NC}"
    echo -e "${YELLOW}Usage: ./scripts/change-project-name.sh <new-project-name>${NC}"
    echo -e "${YELLOW}Example: ./scripts/change-project-name.sh my-awesome-app${NC}"
    exit 1
fi

NEW_NAME="$1"

# Validate project name (lowercase, alphanumeric, hyphens only)
if ! [[ "$NEW_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}Error: Project name must contain only lowercase letters, numbers, and hyphens${NC}"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}          Project Name Change Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Current name:${NC} $CURRENT_NAME"
echo -e "${YELLOW}New name:${NC}     $NEW_NAME"
echo ""

# Confirm before proceeding
read -p "$(echo -e ${YELLOW}Are you sure you want to proceed? [y/N]: ${NC})" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Starting project name change...${NC}"
echo ""

# Function to update file
update_file() {
    local file=$1
    local search=$2
    local replace=$3
    
    if [ -f "$file" ]; then
        if grep -q "$search" "$file" 2>/dev/null; then
            # Create backup
            cp "$file" "$file.bak"
            
            # Use sed to replace (cross-platform compatible)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|$search|$replace|g" "$file"
            else
                # Linux
                sed -i "s|$search|$replace|g" "$file"
            fi
            
            echo -e "  ${GREEN}✓${NC} Updated: $file"
            
            # Remove backup if successful
            rm "$file.bak"
        else
            echo -e "  ${YELLOW}○${NC} No changes needed: $file"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC}  File not found: $file"
    fi
}

echo -e "${BLUE}[1/7]${NC} Updating package.json..."
update_file "package.json" "\"name\": \"$CURRENT_NAME\"" "\"name\": \"$NEW_NAME\""

echo ""
echo -e "${BLUE}[2/7]${NC} Updating package-lock.json..."
if [ -f "package-lock.json" ]; then
    update_file "package-lock.json" "\"name\": \"$CURRENT_NAME\"" "\"name\": \"$NEW_NAME\""
else
    echo -e "  ${YELLOW}○${NC} package-lock.json not found (skipping)"
fi

echo ""
echo -e "${BLUE}[3/7]${NC} Updating docker-compose.yml..."
update_file "docker-compose.yml" "nest-app:" "$NEW_NAME:"
update_file "docker-compose.yml" "container_name: nest-app" "container_name: $NEW_NAME"

echo ""
echo -e "${BLUE}[4/7]${NC} Updating docker-compose.prod.yml..."
if [ -f "docker-compose.prod.yml" ]; then
    update_file "docker-compose.prod.yml" "nest-app:" "$NEW_NAME:"
    update_file "docker-compose.prod.yml" "container_name: nest-app" "container_name: $NEW_NAME"
else
    echo -e "  ${YELLOW}○${NC} docker-compose.prod.yml not found (skipping)"
fi

echo ""
echo -e "${BLUE}[5/7]${NC} Updating .env files..."
if [ -f ".env.example" ]; then
    update_file ".env.example" "APP_NAME=$CURRENT_NAME" "APP_NAME=$NEW_NAME"
fi
if [ -f ".env.development" ]; then
    update_file ".env.development" "APP_NAME=$CURRENT_NAME" "APP_NAME=$NEW_NAME"
fi
if [ -f ".env.production" ]; then
    update_file ".env.production" "APP_NAME=$CURRENT_NAME" "APP_NAME=$NEW_NAME"
fi
if [ -f ".env" ]; then
    update_file ".env" "APP_NAME=$CURRENT_NAME" "APP_NAME=$NEW_NAME"
fi

echo ""
echo -e "${BLUE}[6/7]${NC} Updating README.md..."
if [ -f "README.md" ]; then
    update_file "README.md" "$CURRENT_NAME" "$NEW_NAME"
else
    echo -e "  ${YELLOW}○${NC} README.md not found (skipping)"
fi

echo ""
echo -e "${BLUE}[7/7]${NC} Updating Dockerfile..."
if [ -f "Dockerfile" ]; then
    update_file "Dockerfile" "WORKDIR /app" "WORKDIR /app"
fi
if [ -f "Dockerfile.dev" ]; then
    update_file "Dockerfile.dev" "WORKDIR /app" "WORKDIR /app"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Project name changed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review the changes with: ${BLUE}git diff${NC}"
echo -e "  2. Reinstall dependencies: ${BLUE}npm install${NC}"
echo -e "  3. Rebuild Docker containers: ${BLUE}docker compose down && docker compose up --build${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} If you want to rename the project directory, you'll need to do that manually."
echo ""
