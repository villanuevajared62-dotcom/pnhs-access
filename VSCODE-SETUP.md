# 💻 VS Code Setup Instructions para sa PNHS-ACCESS

## Paano I-setup sa VS Code

### Step 1: I-install ang VS Code
1. Download ang VS Code mula sa: https://code.visualstudio.com/
2. I-install sa computer
3. Buksan ang VS Code

### Step 2: I-open ang Project
1. Sa VS Code, click ang "File" → "Open Folder"
2. Piliin ang `pnhs-access` folder
3. Click "Select Folder"

### Step 3: I-install ang Node.js (Kung wala pa)
1. Download mula sa: https://nodejs.org/
2. I-install ang LTS version
3. I-restart ang computer kung kinakailangan

### Step 4: I-install ang Dependencies
1. Sa VS Code, buksan ang terminal:
   - Press `Ctrl + `` (backtick) or
   - Menu: Terminal → New Terminal
2. Type sa terminal:
   ```bash
   npm install
   ```
3. Antaying matapos (2-5 minuto)

### Step 5: I-run ang Development Server
1. Sa terminal, type:
   ```bash
   npm run dev
   ```
2. Antaying makita ang message:
   ```
   ✓ Ready in X seconds
   ○ Local: http://localhost:3000
   ```
3. Buksan ang browser at pumunta sa: http://localhost:3000

### Step 6: I-test ang System
1. Dapat makita mo ang landing page
2. Click ang "Login" button
3. Gamitin ang demo credentials:
   - Admin: admin / admin123
   - Teacher: teacher1 / teacher123
   - Student: student1 / student123

---

## 📁 Folder Structure Explanation

```
pnhs-access/
│
├── app/                          # Main application folder
│   ├── admin/                    # Admin pages
│   │   └── dashboard/            # Admin dashboard
│   │       └── page.tsx          # Admin dashboard file
│   │
│   ├── teacher/                  # Teacher pages
│   │   └── dashboard/            # Teacher dashboard
│   │       └── page.tsx          # Teacher dashboard file
│   │
│   ├── student/                  # Student pages
│   │   └── dashboard/            # Student dashboard
│   │       └── page.tsx          # Student dashboard file
│   │
│   ├── login/                    # Login page
│   │   └── page.tsx              # Login page file
│   │
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page (home)
│
├── lib/                          # Library/utilities
│   └── auth.ts                   # Authentication logic
│
├── public/                       # Static files (images, etc.)
│
├── .gitignore                    # Git ignore file
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Documentation
```

---

## 🛠 Recommended VS Code Extensions

I-install ang mga recommended extensions para sa better development:

1. **ESLint** - Para sa code linting
2. **Prettier** - Para sa code formatting
3. **Tailwind CSS IntelliSense** - Para sa Tailwind autocomplete
4. **ES7+ React/Redux/React-Native snippets** - Para sa React snippets

### Paano I-install ang Extensions:
1. Click ang Extensions icon sa left sidebar (Ctrl+Shift+X)
2. Search ang extension name
3. Click "Install"

---

## 🔧 Common VS Code Commands

| Command | Action |
|---------|--------|
| `Ctrl + `` | Open/Close Terminal |
| `Ctrl + P` | Quick file open |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + /` | Comment/Uncomment line |
| `Alt + Up/Down` | Move line up/down |
| `Ctrl + D` | Select next occurrence |
| `Ctrl + F` | Find in file |
| `Ctrl + H` | Find and replace |

---

## 📝 Available npm Commands

Gamitin ang mga commands na ito sa terminal:

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Check for code issues
npm run lint
```

---

## 🎨 Paano Mag-edit ng Design

### Colors
Edit ang `tailwind.config.js`:
```javascript
colors: {
  pnhs: {
    primary: '#1e40af',    // Main blue color
    secondary: '#3b82f6',  // Light blue
    // ... add more colors
  },
}
```

### Landing Page
Edit ang `app/page.tsx` para sa:
- Text content
- Features
- Images
- Layout

### Dashboards
Edit ang respective dashboard files:
- `app/admin/dashboard/page.tsx` - Admin dashboard
- `app/teacher/dashboard/page.tsx` - Teacher dashboard
- `app/student/dashboard/page.tsx` - Student dashboard

### Global Styles
Edit ang `app/globals.css` para sa:
- Custom CSS classes
- Global styling
- Fonts

---

## 🔍 Troubleshooting sa VS Code

### Issue: "npm: command not found"
**Solusyon:**
1. I-install ang Node.js
2. I-restart ang VS Code
3. I-restart ang computer

### Issue: "Module not found"
**Solusyon:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Port 3000 already in use
**Solusyon:**
```bash
# Use different port
npm run dev -- -p 3001
```

---

## 💡 Development Tips

1. **Save automatically** - Files auto-save sa VS Code
2. **Hot reload** - Changes reflect automatically sa browser
3. **Console errors** - Check browser console (F12) kung may error
4. **Terminal errors** - Basahin ang terminal output para sa build errors

---

## 🚀 Ready to Deploy?

Kapag satisfied ka na sa development:
1. I-test lahat ng features
2. Basahin ang `DEPLOYMENT-GUIDE.md`
3. I-deploy sa Vercel

**Good luck sa development! 💻**
