# Shelfie Take Home Task

**Author:** Alejandro Noris Gil

This app lets you take a photo of a bookshelf (or pick one from your gallery). It finds the books in the photo and matches them to a catalog.

You need **two programs running at the same time**:

1. The **backend** (Django) — analyzes the photo
2. The **frontend** (Expo) — the screen you use in the browser

Follow the steps in order. Do not skip any step please.

---

## Step 0 — Install these programs first

You only do this once on a computer.

### 0.1 Python 3.12 or newer

1. Go to [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Download and install Python.
3. **Windows:** on the installer, check **Add python.exe to PATH**.
4. Open a terminal (PowerShell on Windows, Terminal on Mac) and type:

```bash
python --version
```

On Mac/Linux, if that fails, try:

```bash
python3 --version
```

You should see something like `Python 3.12.x` or `Python 3.13.x`.

### 0.2 Node.js 20 or newer (this also installs npm)

You can install it from the website **or** from the terminal.

**Option A — website**

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Install the **LTS** version.

**Option B — terminal**

**Windows (PowerShell):**

```powershell
winget install OpenJS.NodeJS.LTS
```

**Mac (Homebrew):**

```bash
brew install node
```

**Linux (Debian/Ubuntu):**

```bash
sudo apt update
sudo apt install nodejs npm
```

After installing, **close the terminal and open a new one**, then check:

```bash
node --version
npm --version
```

Both commands should print a version number. `node` should be **v20** or newer.

### 0.3 Git (to download the project)

1. Go to [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. Install Git.
3. Check it:

```bash
git --version
```

### 0.4 An OpenRouter API key (needed to read book spines)

1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Create an account.
3. Open **Keys** and create a new key.
4. Copy the key and keep it. You will paste it in Step 2.4.

The default model is `openai/gpt-4o-mini`. Your OpenRouter account needs access to a vision model.

---

## Step 1 — Download the project

Open a terminal and go to the folder where you want the project (for example Documents).

```bash
git clone https://github.com/Alexnoris/Shelfie-Take-Home-Task.git
cd Shelfie-Take-Home-Task
```

If you already downloaded a ZIP instead of using Git:

1. Unzip the folder
2. Open a terminal **inside** the unzipped `Shelfie-Take-Home-Task` folder

You are in the right place if you see folders named `backend` and `frontend`, plus a file named `catalog.csv`.

---

## Step 2 — Set up the backend (first terminal)

Keep this terminal open until the end. All commands in this step start from the project folder.

### 2.1 Go into the backend folder

```bash
cd backend
```

### 2.2 Create a virtual environment

This is a private Python folder for this project only.

**Windows (PowerShell):**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If Windows says the script is disabled, run this **once**, then run `Activate.ps1` again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Mac / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

The start of your terminal line should now show `(venv)`. If you do not see `(venv)`, the environment is not active. Stop and fix that before continuing.

### 2.3 Install Python packages

This download is large. It can take several minutes. Stay on this step until it finishes.

```bash
pip install -r requirements.txt
```

Wait until the command ends and you see the prompt again.

### 2.4 Create the `.env` file

This file stores your secret API key. It must live in the `backend` folder (next to `manage.py`).

**Windows (PowerShell), still inside `backend`:**

```powershell
notepad .env
```

If Notepad asks to create the file, click **Yes**. Paste this, then replace the key with yours:

```env
OPENROUTER_API_KEY=paste_your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Save the file and close Notepad.

**Mac / Linux:**

```bash
nano .env
```

Paste the same two lines, save (`Ctrl+O`, Enter), then exit (`Ctrl+X`).

Do not share this file or upload it to GitHub.

### 2.5 Create the database and load the books

Still in `backend`, with `(venv)` active:

```bash
python manage.py migrate
python manage.py load_catalog
```

The second command should say that the books were loaded successfully.

### 2.6 Start the backend

```bash
python manage.py runserver
```

Leave this terminal running. Do not close it.

You should see that it is running at **http://127.0.0.1:8000/**

If this window shows an error, do not start the frontend yet.

---

## Step 3 — Set up the frontend (second terminal)

Open a **new** terminal. Do not close the backend terminal.

### 3.1 Go into the frontend folder

From the project root (`Shelfie-Take-Home-Task`):

```bash
cd frontend
```

If your new terminal opened in your home folder, go to the project first, then into `frontend`. Example:

```powershell
cd \path\to\Shelfie-Take-Home-Task\frontend
```

On Windows that path is often inside `Documents` or `Downloads`. You can also drag the `frontend` folder into the terminal after typing `cd ` (with a space).

### 3.2 Install JavaScript packages

```bash
npm install
```

Wait until it finishes.

### 3.3 Start the app with a tunnel

Always start the frontend with this command (this is the default):

```bash
npx expo start --tunnel
```

Wait until the terminal says the tunnel is ready. You should see a URL that starts with `https://` and looks like `https://xxxx.exp.direct`.

Then:

1. Press `w` in that same terminal to open the **web** app.
2. Or copy the `https://` URL and paste it in your computer browser or your phone browser.

Use that `https://` link. The camera needs HTTPS, so do not use `http://localhost:8081` or `http://192.168...` as the main way to open the app.

Do not use Expo Go for this project.

You should see **Scan your bookshelf**, with **Take a photo** and **Choose from gallery**.

Keep the backend terminal running. The phone (or browser) talks to Expo through the tunnel, and Expo on your computer sends the photo to Django at `http://127.0.0.1:8000`.

---

## Step 4 — Use the app

With **both** terminals still running:

1. Open the `https://` tunnel URL in the browser.
2. Tap the **i** button (top right) to see which books the catalog can detect.
3. Tap **Take a photo** or **Choose from gallery**.
4. Wait on **Analyzing shelf...** (the first photo can take longer because the vision model downloads once).
5. Check the results.
6. Tap **Scan again** or **Back to menu**.

Use a clear photo of book spines. Titles that are not in the catalog will not match.

---

## Next time you want to run it

You do not need to install everything again. Open **two terminals**.

**Terminal 1 — backend**

Windows:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

Mac / Linux:

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 — frontend**

```bash
cd frontend
npx expo start --tunnel
```

Wait for the `https://` URL, press `w`, or open that URL in your browser.

---

## If something goes wrong

**I do not see `(venv)`**  
Go to the `backend` folder and activate it again (`Activate.ps1` on Windows, `source venv/bin/activate` on Mac/Linux).

**`pip install` fails**  
Confirm Python 3.12+, delete the `backend/venv` folder, create it again, activate it, and run `pip install -r requirements.txt` once more. You need a stable internet connection.

**The app says it could not process the image, or the catalog does not load**  
The backend is not running. Go back to Step 2.6.

**The app says there are no books in the catalog**  
In the backend terminal: stop the server with `Ctrl+C`, activate `(venv)`, run `python manage.py load_catalog`, then `python manage.py runserver` again.

**Photos are analyzed but titles are empty / no good matches**  
Check that `backend/.env` has a real `OPENROUTER_API_KEY`. Stop the backend with `Ctrl+C` and start it again so it reads the file.

**The camera does not work**  
Open the `https://` tunnel URL from `npx expo start --tunnel`. HTTP links (`localhost` or `192.168...`) block the camera.

**The tunnel is slow or does not connect**  
Wait until it says `Tunnel ready`. Keep both terminals open. You need internet for the tunnel.

**PowerShell blocks `Activate.ps1`**  
Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then activate again.

**Port 8000 or 8081 is already in use**  
Close the other program using that port, or close the old terminal that is still running the app.

---

## Project layout

```
Shelfie-Take-Home-Task/
├── catalog.csv              # Source catalog (loaded into SQLite)
├── backend/
│   ├── .env                 # You create this (not in git)
│   ├── manage.py
│   ├── requirements.txt
│   └── api/                 # Views, YOLO, VLM, catalog command
└── frontend/
    ├── package.json
    └── src/
        ├── app/             # Screens + Expo API proxies
        └── services/api.js  # Frontend → Expo → Django
```

---
