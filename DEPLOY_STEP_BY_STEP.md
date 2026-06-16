# Deploy App 24/7 with Vercel + Railway

I've prepared all the deployment configs. Here's the minimal step-by-step:

## **Prerequisites**
- GitHub account (free at github.com)
- MongoDB Atlas account (free tier at mongodb.com)

## **Step 1: Push Your Code to GitHub (2 min)**

```bash
# From repo root
git init
git add .
git commit -m "Initial commit - ERP app with Expo mobile"
git remote add origin https://github.com/YOUR_USERNAME/erp-app.git
git branch -M main
git push -u origin main
```

If you already have GitHub repo set up, just push:
```bash
git add .
git commit -m "Add mobile deployment configs"
git push
```

---

## **Step 2: Get MongoDB Connection String (3 min)**

1. Go to https://mongodb.com/cloud/atlas
2. Sign up (free tier)
3. Create a cluster named "erp"
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true`
5. Save it

---

## **Step 3: Deploy Backend to Railway (5 min)**

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your GitHub repo
4. Select the backend folder (or use root if your repo structure matches)
5. Railway will detect Node.js app
6. Go to Variables tab and paste these:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=erp_db
   NODE_ENV=production
   JWT_SECRET=change_me_to_random_secret_key_32_characters_minimum
   PORT=5001
   ```
7. Click Deploy
8. Wait ~2 min, get your URL like `https://erp-backend-prod.railway.app`
9. Copy this URL

---

## **Step 4: Deploy Frontend to Vercel (3 min)**

1. Go to https://vercel.com
2. Click "New Project" → "Import Git Repository"
3. Select your GitHub repo
4. Set:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables → Add:
   ```
   VITE_API_URL=https://your-backend-railway-url.railway.app
   ```
   (Paste the URL from Step 3)
6. Click Deploy
7. Wait ~2 min, you get a URL like `https://erp-xyz.vercel.app`

---

## **Step 5: Test Live App (1 min)**

1. Visit the Vercel URL on your mobile
2. Login with your credentials
3. App should work fully

---

## **Step 6: Enable Auto-Deploy (Optional, 1 min)**

Now every time you push to GitHub:
- Railway auto-redeploys backend
- Vercel auto-redeploys frontend
- No manual work needed

---

## **That's It!**

✅ Frontend runs 24/7 at Vercel  
✅ Backend runs 24/7 at Railway  
✅ Mobile app works anytime, anywhere  
✅ PC can be off  
✅ Free tier (~$5/month if you exceed free limits)

---

## **Costs**

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Vercel | ∞ | 100 GB bandwidth/month |
| Railway | $5/month free | Auto-scales beyond free tier |
| MongoDB | 512 MB | Free tier included |
| **Total** | ~$5/month | Production-ready |

---

## **Troubleshooting**

**"Backend not found after deploying to Vercel"**
- Make sure VITE_API_URL in Vercel env variables is correct
- Redeploy frontend: `git push`

**"Login fails"**
- Check MongoDB is running (Railway logs)
- Check JWT_SECRET is set in Railway
- Check CORS in backend allows Vercel domain

**"Mobile app still says backend error"**
- Refresh page hard (Ctrl+Shift+R on web, swipe down on mobile)
- Clear browser cache
- Check both services are deployed (check their dashboards)

---

## **What I've Prepared**

✅ `backend/Dockerfile` - Container for backend  
✅ `frontend/Dockerfile` - PWA static hosting  
✅ `vercel.json` - Vercel config  
✅ `railway.json` - Railway config  
✅ `.github/workflows/deploy.yml` - Auto CI/CD  
✅ All CORS allowed for mobile access  

You just need to:
1. Push to GitHub
2. Sign up for Railway & Vercel (2 clicks each)
3. Connect your repo (1 click each)
4. Add environment variables (copy-paste)
5. Done!

---

## **Commands to Run Right Now**

```bash
# Push to GitHub
git add .
git commit -m "Add production deployment configs"
git push

# Then go to:
# 1. https://railway.app → New Project → Deploy from GitHub
# 2. https://vercel.com → New Project → Import Git Repo

# That's all!
```
