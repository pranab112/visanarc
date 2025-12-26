# Custom Domain Setup for Railway

## Prerequisites
- A domain name (e.g., from Namecheap, GoDaddy, Cloudflare, etc.)
- Access to your domain's DNS settings
- Your Railway app deployed and running

## Step 1: Add Domain in Railway

1. Go to your Railway project dashboard
2. Click on your deployed service
3. Navigate to **Settings** → **Networking**
4. Click **+ Custom Domain**
5. Enter your domain (e.g., `visainarc.com` or `app.visainarc.com`)
6. Railway will provide you with DNS records to add

## Step 2: Configure DNS Records

Railway will show you one of these options:

### Option A: Root Domain (visainarc.com)
Add these records to your DNS provider:

```
Type: A
Name: @
Value: [Railway will provide IP address]
```

### Option B: Subdomain (app.visainarc.com)
Add this record to your DNS provider:

```
Type: CNAME
Name: app (or your chosen subdomain)
Value: [Railway will provide a *.railway.app domain]
```

## Step 3: DNS Provider Specific Instructions

### Cloudflare
1. Log into Cloudflare Dashboard
2. Select your domain
3. Go to DNS section
4. Add the record Railway provided
5. **Important**: Set Proxy status to **DNS only** (gray cloud), not Proxied

### Namecheap
1. Sign in to Namecheap
2. Go to Domain List → Manage
3. Click Advanced DNS
4. Add New Record with Railway's values
5. TTL: Automatic

### GoDaddy
1. Sign in to GoDaddy
2. Go to My Products → Domains
3. Click DNS next to your domain
4. Add record with Railway's values
5. TTL: 600 seconds

## Step 4: Wait for Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Usually active within 30 minutes
- Check status in Railway dashboard (will show ✓ when verified)

## Step 5: Enable HTTPS (Automatic)

Railway automatically provisions SSL certificates via Let's Encrypt once DNS is verified.

## Troubleshooting

### Domain Not Verifying
- Ensure DNS records are exactly as Railway specified
- Check there are no conflicting records
- If using Cloudflare, ensure proxy is disabled
- Wait longer for DNS propagation

### SSL Certificate Issues
- Certificates are auto-generated after domain verification
- May take 5-10 minutes after domain is verified
- Check Railway logs for any SSL errors

### Testing DNS
Use these commands to verify DNS setup:

```bash
# Check A record (for root domain)
dig visainarc.com

# Check CNAME record (for subdomain)
dig app.visainarc.com

# Check DNS propagation
nslookup visainarc.com 8.8.8.8
```

## Multiple Domains

You can add multiple custom domains to the same Railway service:
1. Add each domain separately in Railway
2. Configure DNS for each domain
3. All domains will point to the same application

## Environment Variables for Domain

If your app needs to know its domain, add to Railway environment variables:

```env
VITE_APP_URL=https://visainarc.com
VITE_PUBLIC_URL=https://visainarc.com
```

## Redirect Configuration

To redirect www to non-www or vice versa, you'll need to:
1. Add both domains in Railway
2. Configure both in DNS
3. Handle redirect in your application or use Cloudflare Page Rules

## Support Resources

- Railway Docs: https://docs.railway.app/deploy/exposing-your-app
- Railway Discord: https://discord.gg/railway
- DNS Checker: https://dnschecker.org