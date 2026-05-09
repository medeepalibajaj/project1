# Bright Future Primary School Management System

Complete Railway-ready project.

## Default login

- No default credentials provided. Please seed your own user in the `users` table.

## Required Railway variables

```txt
JWT_SECRET=your-long-secret
BACKUP_SECRET=your-long-backup-secret
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

## New features

- Year selection after login: 2025 to 2030
- Year-specific students, admissions, monthly fees, admission fees and report cards
- Encrypted backup download using AES-256-GCM
- Upload/restore encrypted backup
- Google Drive backup uploads encrypted backup file
- Roles:
  - Master-admin: full access
  - Admin: can manage users and fee structure
  - Co-admin: all normal powers except fee structure and user/role changes

## Deploy

1. Upload all files to GitHub.
2. Connect repo to Railway.
3. Add MySQL service.
4. Set environment variables.
5. Deploy.

If UI does not change, make sure Railway used this Dockerfile and check build logs for `npm run build`.
