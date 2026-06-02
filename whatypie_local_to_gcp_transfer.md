# Transfer Guide: Moving Local Source Code to Google Cloud VM (Windows to Linux)

Since your code is currently on your local Windows system, you need to transfer it to your Google Cloud Virtual Machine. Here are the three most common and direct ways to do this.

---

## Method 1: Using private Git Repository (Recommended)
This is the cleanest and most professional way. It handles file changes, ignores heavy directories (like `node_modules`), and makes future updates extremely easy.

1.  **On your local machine**:
    *   Create a private repository on GitHub, GitLab, or Bitbucket.
    *   Initialize git in your workspace root, add a `.gitignore` to exclude `node_modules` and `.next` build files, commit the code, and push it:
        ```bash
        git init
        git add .
        git commit -m "initial commit"
        git branch -M main
        git remote add origin <your-private-repo-url>
        git push -u origin main
        ```
2.  **On your GCP VM**:
    *   Authorize the VM with GitHub (e.g., using SSH keys or a Personal Access Token).
    *   Clone the repository directly:
        ```bash
        cd /var/www
        git clone <your-private-repo-url> whatypie
        ```
3.  **To push updates later**:
    *   Locally: `git add . && git commit -m "Update" && git push`
    *   On VM: `git pull`

---

## Method 2: Using SFTP (FileZilla / WinSCP)
If you prefer a graphical user interface where you can drag and drop files from Windows to Linux:

1.  **Generate SSH Keys (if not already done)**:
    *   Open PowerShell on your Windows machine and run:
        ```powershell
        ssh-keygen -t rsa -f ~\id_gcp -C your-gcp-username
        ```
2.  **Add SSH Key to GCP**:
    *   Go to **GCP Console** -> **Compute Engine** -> **Metadata** -> **SSH Keys**.
    *   Click **Add SSH Keys** and paste the content of your local public key (`C:\Users\YourUsername\id_gcp.pub`).
3.  **Configure FileZilla**:
    *   Download and open FileZilla.
    *   Go to **Edit** -> **Settings** -> **Connection** -> **SFTP**.
    *   Click **Add keyfile...** and select your private key file (`C:\Users\YourUsername\id_gcp`).
    *   Go to **File** -> **Site Manager** -> **New Site**.
    *   Set Protocol to **SFTP**, Host to your **GCP VM External IP**, and Logon Type to **Interactive** (or Key File with your username).
    *   Connect! You can now drag and drop your local files from the left panel to the right panel (`/var/www/whatypie`).

> [!WARNING]
> Do NOT upload `node_modules` or `.next` folders. They are very large, and it is much faster to run `npm install` and `npm run build` directly on the VM.

---

## Method 3: Using Google Cloud SDK (gcloud CLI)
If you have the Google Cloud SDK installed on your Windows machine, you can use the built-in command-line tool `gcloud compute scp`.

1.  **Zip the Code (Excluding dependencies)**:
    *   Zip the folders using a compression tool on Windows (e.g. 7-Zip), leaving out `node_modules`, `.git`, `.next`, etc. Let's call it `whatypie.zip`.
2.  **Upload the Zip using gcloud**:
    *   Open Command Prompt / PowerShell on Windows and run:
        ```bash
        gcloud compute scp --recurse C:\path\to\your\whatypie.zip VM_NAME:~/ --zone ZONE
        ```
        *(Replace `VM_NAME` with your instance name and `ZONE` with the zone of your instance like `us-central1-a`)*.
3.  **Unzip on the VM**:
    *   SSH into the VM and run:
        ```bash
        sudo apt-get install unzip
        unzip whatypie.zip -d /var/www/whatypie
        ```
