// Shared types between frontend and backend
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  is_active: boolean;
}

export interface TestMetadata {
  id: number;
  test_name: string;
  current_price: number;
  current_tat: number;
  current_lab_section: string;
  is_default: boolean;
}

export interface TestRecord {
  id: number;
  encounter_date: string;
  lab_no: string;
  test_name: string;
  price_at_test: number;
  tat_at_test: number;
  lab_section_at_test: string;
}
```

### **47. Create .gitignore**
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv

# Data files (generated)
frontend/public/data.json
frontend/public/TimeOut.csv
frontend/public/meta.csv

# Debug
debug/