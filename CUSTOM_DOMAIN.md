# 🌐 Custom Domain Setup Guide

## Get Your Own Domain Name! 🎉

Instead of using `yourusername.github.io`, get a professional domain like:
- **goofygooberedits.com** 🎬
- **vibevideoedits.com** ✨
- **quicktiktokeditor.com** 📱
- **aivideomagic.com** 🤖

## Step-by-Step: Purchase & Setup

### Step 1: Buy a Domain ($10-15/year)

**Recommended Registrars:**

#### Option A: Namecheap (Easiest)
1. Go to [namecheap.com](https://www.namecheap.com)
2. Search for your desired name
3. Add to cart (usually $8-12/year)
4. Complete purchase
5. ✅ You own the domain!

#### Option B: Google Domains
1. Go to [domains.google](https://domains.google)
2. Search and purchase
3. Usually $12/year
4. Integrated with Google services

#### Option C: Cloudflare (Cheapest)
1. Go to [cloudflare.com](https://www.cloudflare.com)
2. Register domain
3. At-cost pricing (~$8-10/year)
4. Includes free security features

### Step 2: Connect to GitHub Pages

Once you have your domain, connect it to your website:

#### A. Add CNAME File to Your Repository

1. **Create a file named `CNAME`** (no extension) in your repository root:
   ```bash
   echo "goofygooberedits.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

2. **Or create it directly on GitHub:**
   - Go to your repository
   - Click "Add file" → "Create new file"
   - Name it: `CNAME`
   - Content: `goofygooberedits.com` (your domain)
   - Commit the file

#### B. Configure DNS Settings

**At your domain registrar (Namecheap, Google Domains, etc.):**

1. **Go to DNS settings** for your domain

2. **Add these records:**

   **For root domain (goofygooberedits.com):**
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.109.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.110.153
   TTL: Automatic
   
   Type: A
   Host: @
   Value: 185.199.111.153
   TTL: Automatic
   ```

   **For www subdomain (www.goofygooberedits.com):**
   ```
   Type: CNAME
   Host: www
   Value: yourusername.github.io
   TTL: Automatic
   ```

3. **Save changes**

#### C. Enable in GitHub Settings

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Pages** section
4. Under "Custom domain", enter: `goofygooberedits.com`
5. Click **Save**
6. ✅ Check "Enforce HTTPS" (wait 5-10 minutes first)

### Step 3: Wait for DNS Propagation

- DNS changes take **5 minutes to 48 hours** (usually 10-30 minutes)
- Check status: [dnschecker.org](https://dnschecker.org)
- Once propagated, your site will be live!

## Alternative: Deploy to Netlify (Even Easier!)

Netlify makes custom domains super easy:

### Steps:

1. **Deploy to Netlify:**
   - Sign up at [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Deploy automatically

2. **Add Custom Domain:**
   - In Netlify dashboard, go to "Domain settings"
   - Click "Add custom domain"
   - Enter: `goofygooberedits.com`
   - Netlify tells you EXACTLY what DNS records to add

3. **Configure DNS:**
   - Follow Netlify's instructions (they're very clear)
   - Usually just one CNAME record: `your-site.netlify.app`

4. **Enable HTTPS:**
   - Netlify does this automatically (free)
   - Takes ~1 minute

**Pros of Netlify:**
- ✅ Automatic HTTPS
- ✅ Faster than GitHub Pages
- ✅ Better custom domain setup
- ✅ Free tier is generous
- ✅ Automatic deploys on push

## Domain Name Ideas

### Creative Names:
- **goofygooberedits.com** - Fun & memorable
- **snapvidedits.com** - Short & catchy
- **quickclipstudio.com** - Professional
- **tiktokvideopro.com** - Clear purpose
- **aiclipeditor.com** - Highlights AI feature
- **vibesvideolab.com** - Creative vibe
- **flashvideocuts.com** - Emphasizes speed
- **clipcraftai.com** - Tech + craft

### Check Availability:
Use [namecheckr.com](https://namecheckr.com) to check if your desired name is available across domains and social media.

## Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Domain Registration | $8-15 | per year |
| GitHub Pages Hosting | FREE | forever |
| HTTPS Certificate | FREE | (automatic) |
| DNS Service | FREE | (included) |
| **Total** | **$8-15** | **per year** |

### Alternative Hosting Costs:
| Service | Cost | Features |
|---------|------|----------|
| GitHub Pages | FREE | Good for most users |
| Netlify | FREE | Better performance |
| Vercel | FREE | Fastest |
| Traditional Hosting | $5-20/mo | Overkill for this |

## Subdomain Strategy (Free Alternative)

If you don't want to buy a domain yet, use a free subdomain service:

### Free Options:

1. **is-a.dev** (for developers)
   - Get: `yourname.is-a.dev`
   - Free forever
   - GitHub repository required
   - [is-a.dev](https://is-a.dev)

2. **js.org** (for JS projects)
   - Get: `yourname.js.org`
   - Free forever
   - [js.org](https://js.org)

3. **GitHub Pages Default**
   - Get: `yourusername.github.io/first-website`
   - Completely free
   - Works immediately

## Security with Custom Domain

### Automatic Security Features:

1. **HTTPS Encryption** ✅
   - GitHub Pages provides free SSL certificate
   - All traffic is encrypted
   - Protects user privacy

2. **No Server = No Server Hacks** ✅
   - Static site = no backend to hack
   - No database to breach
   - Client-side processing only

3. **No IP Address Exposure** ✅
   - Your personal IP is never shown
   - Users connect to GitHub's servers (or Netlify's)
   - Your computer's IP stays private

### What Users See:

**With Custom Domain:**
- URL: `https://goofygooberedits.com`
- Connection: Encrypted (🔒 in browser)
- Your IP: Hidden (they see GitHub's servers)

**Without Custom Domain:**
- URL: `https://yourusername.github.io/first-website`
- Connection: Still encrypted ✅
- Your IP: Still hidden ✅

## DNS Configuration Examples

### Example 1: Namecheap

```
Advanced DNS Settings
┌────────────────────────────────────────────┐
│ Type    Host    Value                      │
├────────────────────────────────────────────┤
│ A       @       185.199.108.153           │
│ A       @       185.199.109.153           │
│ A       @       185.199.110.153           │
│ A       @       185.199.111.153           │
│ CNAME   www     yourusername.github.io.   │
└────────────────────────────────────────────┘
```

### Example 2: Cloudflare

```
DNS Records
┌────────────────────────────────────────────┐
│ Type    Name    Content                    │
├────────────────────────────────────────────┤
│ A       @       185.199.108.153   [Proxied]│
│ A       @       185.199.109.153   [Proxied]│
│ A       @       185.199.110.153   [Proxied]│
│ A       @       185.199.111.153   [Proxied]│
│ CNAME   www     yourusername.github.io     │
└────────────────────────────────────────────┘
```

**Cloudflare Bonus:** Orange cloud = free CDN + DDoS protection!

## Testing Your Setup

### Check if it's working:

1. **Test DNS Propagation:**
   ```bash
   nslookup goofygooberedits.com
   ```
   Should show GitHub's IP addresses

2. **Test Website Loading:**
   - Open browser
   - Go to: `http://goofygooberedits.com`
   - Should redirect to HTTPS
   - Your video editor should load!

3. **Test HTTPS:**
   - Go to: `https://goofygooberedits.com`
   - Check for 🔒 in address bar
   - Click padlock → Should show "Connection is secure"

4. **Test www Version:**
   - Go to: `http://www.goofygooberedits.com`
   - Should work and redirect to HTTPS

## Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN"
- **Cause:** DNS not propagated yet
- **Fix:** Wait 30 minutes to 24 hours
- **Check:** Use dnschecker.org

### "Your connection is not private"
- **Cause:** HTTPS not enabled yet on GitHub
- **Fix:** Wait 10 minutes, then enable in GitHub Settings
- **Check:** GitHub Pages settings page

### "404 - There isn't a GitHub Pages site here"
- **Cause:** CNAME file missing or wrong
- **Fix:** Check CNAME file contains correct domain
- **Check:** Look at repository root for CNAME file

### Website loads but without styles
- **Cause:** Absolute paths in HTML
- **Fix:** Check that CSS/JS paths are relative
- **Check:** Should be `href="styles.css"` not `href="/styles.css"`

## Professional Touches

Once your custom domain is working:

1. **Add Logo:**
   - Create favicon.ico
   - Add to repository root
   - Appears in browser tab

2. **Update Social Media:**
   - Share your custom domain
   - Add to TikTok bio
   - Include in Instagram link

3. **Create QR Code:**
   - Generate QR code for your domain
   - Share in videos
   - Print on business cards

4. **Set Up Email:**
   - Some registrars offer email forwarding
   - Get: hello@goofygooberedits.com
   - Forward to your Gmail

## Recommended Setup

For the best experience, I recommend:

1. **Domain:** Namecheap (~$10/year)
2. **Hosting:** GitHub Pages (FREE)
3. **SSL:** Automatic via GitHub (FREE)
4. **CDN:** Cloudflare DNS (FREE)

**Total Cost: ~$10/year for professional domain!**

Or even better:

1. **Domain:** Your choice (~$10/year)
2. **Hosting:** Netlify (FREE)
3. **Everything else:** Automatic!

## Next Steps

1. ✅ Choose your domain name
2. ✅ Purchase from registrar
3. ✅ Add CNAME file to repository
4. ✅ Configure DNS settings
5. ✅ Enable HTTPS on GitHub
6. ✅ Test your site!
7. ✅ Share with the world! 🚀

---

**Your video editor will look so much more professional with a custom domain!**

Instead of: `https://gabemaurer.github.io/first-website`

You'll have: `https://goofygooberedits.com` 🎬✨

Much better for sharing on TikTok and Instagram!
