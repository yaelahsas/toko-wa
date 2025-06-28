# Setup Checklist

## 0. Fix Node.js/npm Issue (URGENT)
Your current npm installation is corrupted. Choose one of these solutions:

### Option A: Reinstall npm
```bash
# Download and run the latest Node.js installer from nodejs.org
# This will fix the npm installation
```

### Option B: Use alternative package manager
```bash
# Install pnpm (recommended for this project)
npm install -g pnpm
# or download from https://pnpm.io/installation

# Or install yarn
npm install -g yarn
```

### Option C: Fix npm manually
```bash
# Try to reinstall npm
npm install -g npm@latest
```

## 1. Database Setup
- [ ] Install PostgreSQL if not installed
- [ ] Create database:
```sql
CREATE DATABASE toko_wa;
CREATE USER toko_user WITH PASSWORD 'your_password';
```
- [ ] Run setup script:
```bash
psql -U postgres -d toko_wa -f setup-database.sql
```

## 2. Environment Setup
Create `.env` file with:
```env
# Database
DATABASE_URL="postgresql://toko_user:your_password@localhost:5432/toko_wa"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Admin credentials (for initial setup)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
```

## 3. Install Dependencies
```bash
# Using npm (after fixing npm issue above)
npm install

# Using yarn
yarn install

# Using pnpm (recommended)
pnpm install
```

## 4. Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 5. Git Setup
```bash
# If not initialized
git init

# Add remote repository
git remote add origin https://github.com/yourusername/toko-wa.git

# Create initial commit
git add .
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main
```

## 6. Verify Setup
- [ ] Database tables created successfully
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Development server running
- [ ] Admin login working
- [ ] Product management functional
- [ ] Category management functional

## 7. Additional Configuration
- [ ] Update store information in `data/store-config.json`
- [ ] Configure WhatsApp number for notifications
- [ ] Set up product images in public/uploads directory
- [ ] Configure minimum purchase requirements

## Troubleshooting npm Error
If you continue to get the `Cannot find module '@npmcli/config'` error:

1. **Complete Node.js reinstall** (Recommended):
   - Uninstall Node.js completely
   - Download fresh installer from nodejs.org
   - Install Node.js v18.x or v20.x (latest stable)

2. **Use pnpm instead** (Alternative):
   - Download pnpm directly from https://pnpm.io/installation
   - Use `pnpm install` and `pnpm dev` instead of npm commands

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
