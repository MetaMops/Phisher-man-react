#!/bin/bash

# Phisher-Man React Edition Setup Script
# 
# Rebuilt by: apt_start_latifi
# Discord: https://discord.gg/KcuMUUAP5T
# Original Tool: https://github.com/FDX100/Phisher-man
# 
# This is a complete rebuild of the original Phisher-Man tool in React and Node.js
# 
# IMPORTANT: The original repository had no license. This project is a UI rewrite 
# and modernization of the original concept. All original phishing templates and 
# concepts remain attributed to FDX100.
# 
# DISCLAIMER: This tool is for educational and authorized testing purposes only.
# Users are responsible for complying with all applicable laws and regulations.
# The authors are not responsible for any misuse of this software.

echo "🚀 Phisher-Man React Edition - Educational Setup Script"
echo "========================================================"
echo "⚠️  WARNING: This is for EDUCATIONAL PURPOSES ONLY"
echo "⚠️  Use only in isolated lab environments"
echo "⚠️  Do not deploy in production or public networks"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run this script as root. Run as regular user.${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking system requirements...${NC}"

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Installing Node.js...${NC}"
    
    # Detect OS and install Node.js
    if command_exists apt; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif command_exists pacman; then
        # Arch Linux
        sudo pacman -S nodejs npm
    else
        echo -e "${RED}❌ Unsupported package manager. Please install Node.js manually.${NC}"
        exit 1
    fi
    
    if ! command_exists node; then
        echo -e "${RED}❌ Failed to install Node.js. Please install manually.${NC}"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version 14 or higher is recommended. Current version: $(node -v)${NC}"
fi

print_status 0 "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

print_status 0 "npm $(npm -v) is installed"

# Check if Apache2 is installed
APACHE_FOUND=false

# Check for apache2 command in PATH
if command_exists apache2; then
    APACHE_FOUND=true
# Check for httpd command in PATH (CentOS/RHEL)
elif command_exists httpd; then
    APACHE_FOUND=true
# Check for apache2 in common system locations
elif [ -f "/usr/sbin/apache2" ] || [ -f "/usr/bin/apache2" ] || [ -f "/sbin/apache2" ] || [ -f "/bin/apache2" ]; then
    APACHE_FOUND=true
# Check for httpd in common system locations
elif [ -f "/usr/sbin/httpd" ] || [ -f "/usr/bin/httpd" ] || [ -f "/sbin/httpd" ] || [ -f "/bin/httpd" ]; then
    APACHE_FOUND=true
# Check for apache2 in alternative locations
elif [ -f "/opt/apache2/bin/apache2" ] || [ -f "/usr/local/bin/apache2" ] || [ -f "/usr/local/sbin/apache2" ]; then
    APACHE_FOUND=true
# Check for httpd in alternative locations
elif [ -f "/opt/httpd/bin/httpd" ] || [ -f "/usr/local/bin/httpd" ] || [ -f "/usr/local/sbin/httpd" ]; then
    APACHE_FOUND=true
# Check for apache2 in homebrew locations (macOS)
elif [ -f "/opt/homebrew/bin/apache2" ] || [ -f "/usr/local/Cellar/httpd" ]; then
    APACHE_FOUND=true
# Check for apache2 in snap locations
elif [ -f "/snap/bin/apache2" ] || [ -f "/var/snap/apache2" ]; then
    APACHE_FOUND=true
# Check for apache2 in flatpak locations
elif [ -f "/var/lib/flatpak/exports/bin/apache2" ] || [ -f "/home/$USER/.local/share/flatpak/exports/bin/apache2" ]; then
    APACHE_FOUND=true
# Check for apache2 in docker/container locations
elif [ -f "/usr/local/apache2/bin/httpd" ] || [ -f "/opt/bitnami/apache/bin/httpd" ]; then
    APACHE_FOUND=true
# Check for apache2 in custom installations
elif [ -f "/opt/apache/bin/apache2" ] || [ -f "/opt/apache/bin/httpd" ]; then
    APACHE_FOUND=true
# Check for apache2 in systemd service (if service exists but binary not in PATH)
elif systemctl list-unit-files | grep -q "apache2.service" || systemctl list-unit-files | grep -q "httpd.service"; then
    APACHE_FOUND=true
fi

if [ "$APACHE_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  Apache2 is not installed. Installing Apache2...${NC}"
    
    if command_exists apt; then
        sudo apt update
        sudo apt install -y apache2
    elif command_exists yum; then
        sudo yum install -y httpd
    elif command_exists pacman; then
        sudo pacman -S apache
    else
        echo -e "${RED}❌ Unsupported package manager. Please install Apache2 manually.${NC}"
        echo -e "${YELLOW}📖 Manual installation guide:${NC}"
        echo -e "  • Ubuntu/Debian: ${GREEN}sudo apt install apache2${NC}"
        echo -e "  • CentOS/RHEL:   ${GREEN}sudo yum install httpd${NC}"
        echo -e "  • Arch Linux:    ${GREEN}sudo pacman -S apache${NC}"
        echo -e "  • Configuration: ${GREEN}/etc/apache2/sites-available/000-default.conf${NC}"
        exit 1
    fi
    
    # Verify installation after attempt
    APACHE_FOUND=false
    if command_exists apache2 || command_exists httpd || [ -f "/usr/sbin/apache2" ] || [ -f "/usr/sbin/httpd" ]; then
        APACHE_FOUND=true
    fi
    
    if [ "$APACHE_FOUND" = false ]; then
        echo -e "${RED}❌ Failed to install Apache2 automatically.${NC}"
        echo -e "${YELLOW}📖 Please install Apache2 manually:${NC}"
        echo -e "  • Ubuntu/Debian: ${GREEN}sudo apt install apache2${NC}"
        echo -e "  • CentOS/RHEL:   ${GREEN}sudo yum install httpd${NC}"
        echo -e "  • Arch Linux:    ${GREEN}sudo pacman -S apache${NC}"
        echo -e "  • Configuration: ${GREEN}/etc/apache2/sites-available/000-default.conf${NC}"
        echo -e "  • Document Root: ${GREEN}/var/www/html/${NC}"
        exit 1
    fi
fi

print_status 0 "Apache2 is installed"

# Setup Apache directory
echo -e "${BLUE}🔧 Setting up Apache directory...${NC}"
sudo mkdir -p /var/www/html/
sudo chown -R www-data:www-data /var/www/html/ 2>/dev/null || sudo chown -R apache:apache /var/www/html/ 2>/dev/null
sudo chmod -R 755 /var/www/html/

print_status 0 "Apache directory configured"

# Install server dependencies
echo -e "${BLUE}📦 Installing server dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_status 0 "Server dependencies installed"
    else
        print_status 1 "Failed to install server dependencies"
        exit 1
    fi
else
    print_status 0 "Server dependencies already installed"
fi

# Install client dependencies
echo -e "${BLUE}📦 Installing client dependencies...${NC}"
if [ ! -d "client/node_modules" ]; then
    cd client
    npm install
    if [ $? -eq 0 ]; then
        print_status 0 "Client dependencies installed"
    else
        print_status 1 "Failed to install client dependencies"
        exit 1
    fi
    cd ..
else
    print_status 0 "Client dependencies already installed"
fi

# Build the React app
echo -e "${BLUE}🏗️  Building React application...${NC}"
cd client
npm run build
if [ $? -eq 0 ]; then
    print_status 0 "React application built successfully"
else
    print_status 1 "Failed to build React application"
    exit 1
fi
cd ..

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "=============================================="
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Start the server:${NC} sudo node server.js"
echo -e "${YELLOW}2. Open dashboard:${NC} http://localhost:5000"
echo ""
echo -e "${BLUE}📚 Available commands:${NC}"
echo -e "  • Start server:     ${GREEN}sudo node server.js${NC}"
echo -e "  • View logs:        ${GREEN}tail -f /var/log/apache2/error.log${NC}"
echo -e "  • Check Apache:     ${GREEN}sudo systemctl status apache2${NC}"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo -e "  • Full docs:        ${GREEN}docs/README.md${NC}"
echo -e "  • Troubleshooting:  ${GREEN}docs/TROUBLESHOOTING.md${NC}"
echo -e "  • API Reference:    ${GREEN}docs/API.md${NC}"
echo ""
echo -e "${YELLOW}⚠️  Remember: Always use 'sudo node server.js' to start the application${NC}"
echo ""
