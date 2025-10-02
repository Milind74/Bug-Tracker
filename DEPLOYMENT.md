# Mini Jira - Bug Tracker

## Deploy to Vercel

This project is configured for deployment on Vercel.

### Deployment Configuration

- **Build Command:** `cd bug-tracker-client && npm run build`
- **Output Directory:** `bug-tracker-client/dist`
- **Install Command:** `cd bug-tracker-client && npm install`
- **Node.js Version:** 20.x (specified in .nvmrc)

### Environment Variables

Make sure to set the following environment variable in Vercel:

- `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.render.com/api`)

### Manual Deployment Steps

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Configure the build settings as specified above
5. Add environment variables
6. Deploy!