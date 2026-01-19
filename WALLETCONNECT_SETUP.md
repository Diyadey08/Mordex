# WalletConnect Setup Instructions

## Error Fix: "Failed to fetch remote project configuration. HTTP status code: 403"

This error occurs because you need a valid WalletConnect Project ID. Follow these steps:

### 1. Get a WalletConnect Project ID

1. Visit [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up for a free account (if you don't have one)
3. Create a new project
4. Copy the **Project ID** from your dashboard

### 2. Set Environment Variable

1. Open the `.env.local` file in the root directory
2. Find the line: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=`
3. Replace it with: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-actual-project-id-here`

Example:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0
```

### 3. Restart Development Server

After updating the environment variable:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Additional Fixes Applied

- **React Strict Mode**: Disabled to prevent WalletConnect double initialization
- **Lit Development Warnings**: Configured webpack to suppress in production
- **Multiple Lit Versions**: Added alias resolution to use single version
- **Missing Project ID Handling**: Added user-friendly error message when project ID is missing

## Troubleshooting

If you still see errors:

1. **Clear cache**: Delete `.next` folder and restart
2. **Check project ID**: Make sure it's copied correctly (no spaces or quotes)
3. **Environment restart**: Some changes require completely restarting VS Code
4. **Network issues**: Ensure you can access cloud.walletconnect.com

## Security Note

- Never commit your actual project ID to version control if it's sensitive
- The current `.env.local` is already in `.gitignore`
- For production, use your hosting platform's environment variable settings