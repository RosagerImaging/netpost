# Vercel Deployment Configuration Guide

## Step-by-Step Instructions to Fix Branch Configuration

### 🔧 Backend Project Configuration

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/rosager-innovations/backend
   - Or navigate to: Dashboard → Projects → Click "backend"

2. **Change Git Settings**
   - Click on "Settings" tab (top navigation)
   - Click on "Git" in the left sidebar
   - Look for "Production Branch" setting
   - Change it from `main` to `backend`
   - Click "Save"

3. **Trigger New Deployment**
   - Go to "Deployments" tab
   - Click "..." menu on the latest deployment
   - Click "Redeploy"
   - Select "Use existing Build Cache" 
   - Click "Redeploy"

### 🔧 Dashboard Project Configuration

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/rosager-innovations/dashboard
   - Or navigate to: Dashboard → Projects → Click "dashboard"

2. **Change Git Settings**
   - Click on "Settings" tab (top navigation)
   - Click on "Git" in the left sidebar
   - Look for "Production Branch" setting
   - Change it from `main` to `dashboard`
   - Click "Save"

3. **Trigger New Deployment**
   - Go to "Deployments" tab
   - Click "..." menu on the latest deployment
   - Click "Redeploy"
   - Select "Use existing Build Cache"
   - Click "Redeploy"

## 📋 Project Information

- **Team**: Rosager Innovations (`team_jHjnDZlvfzUEF019AYup4ZeX`)
- **Backend Project ID**: `prj_4DIjuqP50jYKCDA2fQ9Ds0dMd7Z1`
- **Dashboard Project ID**: `prj_qxpr55VkIRlpr5fz6jcbqlsFR0Cz`

## 🎯 What This Will Fix

- Backend will deploy from `backend` branch instead of `main`
- Dashboard will deploy from `dashboard` branch instead of `main`  
- Future commits to these branches will automatically trigger deployments
- TypeScript errors should be resolved as the branch-specific code is cleaner

## ✅ Expected Results

After completing these steps:
- Backend should deploy successfully from the `backend` branch
- Dashboard should redeploy successfully from the `dashboard` branch
- Both projects will be connected to their respective GitHub branches
- Auto-deployments will work for future commits

## 🆘 If You Still Have Issues

1. Check that the branch names are exactly: `backend` and `dashboard`
2. Verify the repositories are connected to `https://github.com/RosagerImaging/netpost.git`
3. Look for any error messages during deployment
4. You can also try deleting and recreating the Vercel projects if needed