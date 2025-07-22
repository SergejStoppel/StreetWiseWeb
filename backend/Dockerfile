# Use Node.js with Chrome dependencies pre-installed
FROM node:18-bullseye

# Install Chrome dependencies and Chrome itself
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
    # Core Chrome dependencies
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm-dev \
    libxkbcommon-dev \
    libgbm-dev \
    libasound2-dev \
    # Additional dependencies for frame stability
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-dev \
    libc6-dev \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxtst6 \
    # GTK and graphics libraries
    libgtk-3-0 \
    libgtk-3-dev \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    # X11 libraries  
    libx11-6 \
    libxrender1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    # Additional stability dependencies
    fonts-liberation \
    libappindicator1 \
    libappindicator3-1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    # Shared memory fix for Docker
    libxshmfence1 \
    # Additional fonts for better rendering
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create Chrome user data directory with proper permissions
RUN mkdir -p /app/chrome-user-data && chmod 755 /app/chrome-user-data

# Add a non-root user to run the application
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/.local/share/applications \
    && chown -R appuser:appuser /app /home/appuser

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "run", "dev"]