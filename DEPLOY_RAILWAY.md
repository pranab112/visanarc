# Deploying Visa In Arc to Railway

## Prerequisites
- Railway account (sign up at https://railway.app)
- Railway CLI installed (optional)
- Git repository connected to GitHub

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Create Railway Project

#### Option A: Using Railway Dashboard
1. Go to https://railway.app/new
2. Select "Deploy from GitHub repo"
3. Choose your repository: `STUDYABROAD`
4. Railway will automatically detect the configuration

#### Option B: Using Railway CLI
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# Link to your GitHub repo
railway link

# Deploy
railway up
```

### 3. Configure Environment Variables

In Railway Dashboard, go to your project settings and add:

```env
# Required
API_KEY=your_gemini_api_key_here

# Optional (for production with Supabase)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Settings
VITE_APP_NAME=Visa In Arc
VITE_APP_ENV=production
NODE_ENV=production
```

### 4. Domain Configuration

1. In Railway project settings, go to "Settings" → "Domains"
2. Either use the generated Railway domain or add a custom domain
3. Your app will be available at: `https://your-project.railway.app`

## Configuration Files Created

### railway.json
- Defines build and start commands
- Uses Nixpacks builder
- Configures restart policy

### nixpacks.toml
- Specifies Node.js version
- Sets up build process
- Configures production server with `serve`

### .env.example
- Template for environment variables
- Copy to `.env` for local development

## Default Credentials

After deployment, you can login with:
- Email: `admin@agency.com`
- Password: `admin123`

## Monitoring

- View logs: Railway Dashboard → Your Project → Logs
- Monitor metrics: Railway Dashboard → Your Project → Metrics
- Check deployments: Railway Dashboard → Your Project → Deployments

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run build` locally
- Verify all dependencies are in package.json

### App Not Loading
- Verify environment variables are set
- Check Railway logs for errors
- Ensure PORT variable is not hardcoded

### Authentication Issues
- The app uses localStorage for demo mode
- For production, configure Supabase credentials

## Cost Estimation

Railway offers:
- $5 free credit per month
- This app should run within free tier for low traffic
- Estimated cost for production: ~$5-10/month

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Create issue in your GitHub repo