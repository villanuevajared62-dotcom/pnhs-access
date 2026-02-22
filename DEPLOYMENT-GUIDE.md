# 📦 PNHS-ACCESS Vercel Deployment Guide

## Hakbang-hakbang na Gabay sa Pag-deploy sa Vercel

### Paraan 1: Deploy Gamit ang Vercel Website (Pinakamadali)

#### Step 1: Ihanda ang Files
1. Siguraduhin na kompleto ang lahat ng files sa `pnhs-access` folder
2. I-compress ang folder bilang ZIP file (optional, pero recommended)

#### Step 2: Gumawa ng Vercel Account
1. Pumunta sa https://vercel.com
2. Click ang "Sign Up"
3. Mag-sign up gamit ang GitHub, GitLab, o Email
4. Confirm ang email address mo

#### Step 3: I-deploy ang Project
1. Login sa Vercel Dashboard
2. Click ang "Add New..." button
3. Piliin ang "Project"
4. May dalawang option:

   **Option A: I-upload ang Folder Directly**
   - Click "Deploy from a repository" 
   - Sa ibaba, may option na "or, drag and drop your project folder"
   - I-drag ang `pnhs-access` folder doon
   - Automatic na mag-deploy

   **Option B: Gumamit ng GitHub (Recommended para sa updates)**
   - Sundin ang "Paraan 2" sa ibaba

#### Step 4: Antayin ang Deployment
1. Mag-aantay lang ng 1-2 minuto
2. Makikita mo ang progress ng deployment
3. Kapag tapos na, makakakuha ka ng URL (example: `pnhs-access.vercel.app`)

#### Step 5: I-test ang Website
1. Click ang URL na binigay ng Vercel
2. Dapat makita mo na ang landing page
3. Subukan ang login gamit ang demo credentials

---

### Paraan 2: Deploy Gamit ang GitHub (Para sa mas madaling pag-update)

#### Step 1: Gumawa ng GitHub Account
1. Pumunta sa https://github.com
2. Sign up kung wala pang account
3. Confirm email

#### Step 2: I-upload ang Code sa GitHub

**Kung may Git na sa computer:**
```bash
cd pnhs-access
git init
git add .
git commit -m "Initial PNHS-ACCESS deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pnhs-access.git
git push -u origin main
```

**Kung walang Git, gamitin ang GitHub Website:**
1. Pumunta sa GitHub
2. Click "New Repository"
3. Repository name: `pnhs-access`
4. Click "Create repository"
5. Click "uploading an existing file"
6. I-drag lahat ng files mula sa `pnhs-access` folder
7. Click "Commit changes"

#### Step 3: I-connect sa Vercel
1. Login sa Vercel
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Piliin ang `pnhs-access` repository
5. Click "Import"

#### Step 4: Configure Deployment Settings
- Framework Preset: Next.js (auto-detect)
- Root Directory: `./`
- Build Command: `npm run build` (auto-fill)
- Output Directory: `.next` (auto-fill)
- Click "Deploy"

#### Step 5: Antayin ang Build
1. Mag-aantay ng 2-3 minuto
2. Makikita ang progress
3. Kapag successful, makakakuha ng live URL

---

### Paraan 3: Deploy Gamit ang Vercel CLI (Para sa Advanced Users)

#### Step 1: I-install ang Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login sa Vercel
```bash
vercel login
```
- Susundin ang instructions sa browser

#### Step 3: I-deploy ang Project
```bash
cd pnhs-access
vercel
```

#### Mga Tanong na Ibibigay ng Vercel CLI:
1. "Set up and deploy?"
   - Answer: `Y`
2. "Which scope?"
   - Piliin ang account mo
3. "Link to existing project?"
   - Answer: `N` (kung first time)
4. "What's your project's name?"
   - Answer: `pnhs-access` (o kahit ano)
5. "In which directory is your code located?"
   - Answer: `./` (press Enter)

#### Step 4: Production Deployment
```bash
vercel --prod
```

---

## 🔧 Troubleshooting

### Issue: "Build Failed"
**Solusyon:**
1. Siguraduhin na kumpleto ang lahat ng files
2. Check kung tama ang `package.json`
3. Tingnan ang error message sa Vercel logs

### Issue: "404 Not Found"
**Solusyon:**
1. I-refresh ang page
2. Antaying 1-2 minuto para sa propagation
3. Check kung tama ang URL

### Issue: "Runtime Error"
**Solusyon:**
1. Tingnan ang browser console (F12)
2. Check ang Vercel Function logs
3. Siguraduhing na-install lahat ng dependencies

---

## 📝 Post-Deployment Checklist

✅ **Pagkatapos mag-deploy:**
1. [ ] I-test ang landing page
2. [ ] I-test ang login page
3. [ ] I-test ang admin dashboard (admin/admin123)
4. [ ] I-test ang teacher dashboard (teacher1/teacher123)
5. [ ] I-test ang student dashboard (student1/student123)
6. [ ] I-test ang responsiveness (mobile view)
7. [ ] I-save ang production URL

---

## 🌐 Mga Importante Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs

---

## 💡 Tips para sa Successful Deployment

1. **Siguraduhing kompleto ang files** - Check kung nandoon lahat ng folders at files
2. **Gumamit ng GitHub** - Para mas madali ang pag-update sa future
3. **I-save ang URL** - Para madali mong ma-access ang site
4. **I-test muna locally** - Run `npm run dev` bago mag-deploy
5. **Check ang build errors** - Basahin ang error messages kung may problema

---

## 🎯 Custom Domain Setup (Optional)

### Kung gusto mo ng custom domain (e.g., pnhs-access.com):

1. **Sa Vercel Dashboard:**
   - Pumunta sa project settings
   - Click "Domains"
   - Click "Add"
   - I-type ang domain mo

2. **Sa Domain Provider mo:**
   - I-add ang DNS records na ibinigay ng Vercel
   - Antaying 24-48 hours para sa propagation

---

## 📞 Kailangan ng Tulong?

Kung may problema sa deployment:
1. Tingnan ang Vercel logs
2. Check ang error messages
3. Basahin ang documentation
4. Search sa Google ang specific error

**Good luck sa deployment! 🚀**
