# GoDaddy File Permissions Guide

If your website shows a **500 Internal Server Error** even on a simple file like `health.html`, the most likely cause is incorrect file permissions in your GoDaddy Hosting File Manager.

## 1. Access the File Manager
1. Log in to your **GoDaddy Dashboard**.
2. Go to **My Products** > **Web Hosting** > **Manage**.
3. Open the **cPanel Admin** or **Plesk Admin**.
4. Click on **File Manager**.

## 2. Verify Directory Permissions
Look at the `public_html` (for Linux) or `httpdocs` (for Windows) folder.
- **Correct Folder Permission:** `0755` (drwxr-xr-x)
- **Incorrect Permissions:** `777` (too open - many servers block this for security) or `700` (too restricted).

**How to change:**
- Right-click the folder > **Permissions** (or **Change Permissions**).
- Set to `755`.

## 3. Verify File Permissions
Look at the `index.html` and `health.html` files inside that folder.
- **Correct File Permission:** `0644` (rw-r--r--)

**How to change:**
- Select all files in the folder.
- Right-click > **Permissions**.
- Set to `644`.

## 4. Check Ownership (Advanced)
If permissions are correct (`755` and `644`) but it still fails, the folder might be owned by the wrong internal "user" (e.g., `root` instead of your FTP username).
- In the File Manager, look at the **User/Group** or **Owner** column.
- If it says `root` or `0`, click **Reset Owner** or **Fix Permissions** if your hosting dashboard provides those buttons (often found in the "Hosting Tools" or "Account" section).

## 5. Check Error Logs
This is the most "professional" way to see the truth:
1. In cPanel/Plesk, search for **Errors** or **Web Server Logs**.
2. Look at the last 10 entries.
3. If you see "SoftException: Directory /public_html is writeable by group", it means exactly what I said: the permission is `777` or `775` and must be changed to `755`.
