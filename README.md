# Shelfie Take Home Task

**Author:** Alejandro Noris Gil

This application allows users to capture a photo of a bookshelf (or upload one from their gallery), processes the image to detect individual book spines, and matches the extracted text against a realistically messy catalog.

**Tech Stack Overview:**

Backend: Django, SQLite, local YOLO model (for spine detection), OpenRouter API (VLM for text extraction), and thefuzz for fuzzy matching.

Frontend: React Native (Expo) and Expo Camera.

You will need **two programs running at the same time**:

1. The **backend** (Django) — analyzes the photo
2. The **frontend** (Expo) — the screen you use in the browser

Please follow these steps sequentially to ensure a smooth local setup. If you already have Python, Node, Git, and an OpenRouter key, you can jump to **Quick start**.

## Required versions (read this first)

This project will fail if the versions are too old.

| Tool | Required version | How to check |
| --- | --- | --- |
| **Python** | **3.12 or newer** (3.12 or 3.13). Not 3.9, 3.10, or 3.11. | `python --version` or, on Mac/Linux, `python3 --version` |
| **Node.js** | **20 or newer** (20 LTS or 22 LTS). Not 16 or 18. | `node --version` |
| **npm** | Comes with Node. | `npm --version` |

**Mac / Linux — `python` vs `python3`:**  
On a Mac, `python` often does nothing, or it is an old version. Use **`python3`** (and if needed **`pip3`**) unless you already have `(venv)` active. After the virtual environment is active, `python` and `pip` usually work too.

Check **before** you continue:

```bash
python3 --version
node --version
```

You want something like `Python 3.12.x` or `Python 3.13.x`, and `v20.x.x` or `v22.x.x`. If Python is `3.11` or lower, or Node is `v18` or lower, install the versions above first. Do not keep going.

---

## Quick start (if you already have the requirements)

Use this if you already have **Python 3.12+**, **Node 20+**, **Git**, and an **OpenRouter API key**. If not, skip to **Step 0**.

You still need **two terminals**. On Mac/Linux, use `python3` if `python` is not found.

**Terminal 1 — backend**

```bash
git clone https://github.com/Alexnoris/Shelfie-Take-Home-Task.git
cd Shelfie-Take-Home-Task/backend
```

Windows:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Mac / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
```

Create `backend/.env` with:

```env
OPENROUTER_API_KEY=paste_your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Then:

```bash
python manage.py migrate
python manage.py load_catalog
python manage.py runserver
```

(Mac / Linux: `python3 manage.py ...` if needed.)

Leave this terminal running.

**Terminal 2 — frontend**

```bash
cd Shelfie-Take-Home-Task/frontend
npm install
npx expo start --tunnel
```

Copy the `https://` URL and paste it in your **phone** browser. That is the recommended way to use the app.

For example: `https://xxxx.exp.direct`

If anything fails, please use the full steps below.

---

## Step 0 — Install these programs first

You only do this once on a computer.

### 0.1 Python 3.12 or newer

Django 6 in this project needs **Python 3.12+**. Python 3.11 or older will not work.

1. Go to [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Download **Python 3.12** or **3.13** (not 3.10 / 3.11).
3. **Windows:** on the installer, check **Add python.exe to PATH**.
4. Open a terminal (PowerShell on Windows, Terminal on Mac) and check the version.

**Windows:**

```powershell
python --version
```

**Mac / Linux** (try `python3` first):

```bash
python3 --version
```

If `python3` is not found, try `python --version`.

You must see **Python 3.12.x** or **Python 3.13.x**.  
If you see `Python 2.7`, `Python 3.9`, `Python 3.10`, or `Python 3.11`, install a newer Python and check again.

On Mac, from this point on, if a command with `python` fails, run the same command with **`python3`**.

---

### 0.2 Node.js 20 or newer (this also installs npm)

This frontend is Expo SDK 57. It needs **Node.js 20 or newer**. Node 18 or older will not work.

You can install it from the website **or** from the terminal.

**Option A — website**

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Install the **LTS** version (20 or 22). Do not install an old “Current” that is below 20.

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

On Linux, `apt` sometimes installs an old Node. After installing, check the version. If it is below v20, use the website instead.

After installing, **close the terminal and open a new one**, then check:

```bash
node --version
npm --version
```

You must see **v20.x.x** or **v22.x.x** (or newer).  
If you see `v16` or `v18`, install Node 20+ and check again in a **new** terminal.

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

**Mac / Linux reminder:** if `python` is not found, use `python3`. If `pip` is not found, use `pip3` or `python3 -m pip`.

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

**Mac / Linux** (use `python3` here):

```bash
python3 -m venv venv
source venv/bin/activate
```

If `python3` is not found, try `python -m venv venv` only if `python --version` already showed 3.12+.

The start of your terminal line should now show `(venv)`. If you do not see `(venv)`, the environment is not active. Stop and fix that before continuing.

Inside `(venv)`, `python` and `python3` should both be fine. If `pip` fails on Mac, use `pip3` or `python3 -m pip`.

### 2.3 Install Python packages

This download is large. It can take several minutes. Stay on this step until it finishes.

```bash
pip install -r requirements.txt
```

**Mac / Linux:** if `pip` is not found:

```bash
pip3 install -r requirements.txt
```

or:

```bash
python3 -m pip install -r requirements.txt
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

**Mac / Linux:** if `python` is not found, use:

```bash
python3 manage.py migrate
python3 manage.py load_catalog
```

The second command should say that the books were loaded successfully.

### 2.6 Start the backend

```bash
python manage.py runserver
```

**Mac / Linux:** if that fails, use:

```bash
python3 manage.py runserver
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

**Recommended:** copy that `https://xxxx.exp.direct` URL and paste it in your **phone** browser (Safari on iPhone, Chrome on Android). That is the best way to use the camera and the gallery.

You can also press `w` in the terminal to open it on your computer, but a phone is strongly recommended.

Use that `https://` link. The camera needs HTTPS, so do not use `http://localhost:8081` or `http://192.168...`.

Do not use Expo Go for this project.

You should see **Scan your bookshelf**, with **Take a photo** and **Choose from gallery**.

Keep the backend terminal running. The phone (or browser) talks to Expo through the tunnel, and Expo on your computer sends the photo to Django at `http://127.0.0.1:8000`.

---

## Step 4 — Use the app

With **both** terminals still running:

**I strongly recommend using the app on a phone.** Copy the `https://` link from the Expo terminal (the one that looks like `https://xxxx.exp.direct`) and paste it in your phone’s browser. Phone and computer must be able to reach the internet. Keep the two terminals running on the computer.

1. On your phone, open the `https://` tunnel URL.
2. Tap the **i** button (top right) to see which books the catalog can detect.
3. Tap **Take a photo** or **Choose from gallery**.
4. Wait on **Analyzing shelf...** (the first photo can take longer because the vision model downloads once).
5. Check the results.
6. Tap **Scan again** or **Back to menu**.

Use a clear photo of book spines. Titles that are not in the catalog will not match.

The computer browser works too, but the camera and gallery feel much better on a phone.

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
python3 manage.py runserver
```

If `python3` is not found inside `(venv)`, use `python manage.py runserver`.

**Terminal 2 — frontend**

```bash
cd frontend
npx expo start --tunnel
```

Wait for the `https://` URL, copy it, and paste it in your **phone** browser. That is the recommended way to use the app.

---

## If something goes wrong

**I do not see `(venv)`**  
Go to the `backend` folder and activate it again (`Activate.ps1` on Windows, `source venv/bin/activate` on Mac/Linux).

**`python` is not found (especially on Mac)**  
Use `python3` instead (`python3 --version`, `python3 -m venv venv`, `python3 manage.py runserver`). The same idea applies to `pip` → `pip3` or `python3 -m pip`.

**My Python or Node version is too old**  
Python must be **3.12+**. Node must be **20+**. Check with `python3 --version` and `node --version`. Install the versions in Step 0, then open a **new** terminal.

**`pip install` fails**  
Confirm Python is 3.12 or 3.13 (`python3 --version`), delete the `backend/venv` folder, create it again, activate it, and run `pip install -r requirements.txt` (or `python3 -m pip install -r requirements.txt`) once more. You need a stable internet connection.

**The app says it could not process the image, or the catalog does not load**  
The backend is not running. Go back to Step 2.6.

**The app says there are no books in the catalog**  
In the backend terminal: stop the server with `Ctrl+C`, activate `(venv)`, run `python manage.py load_catalog` (on Mac: `python3 manage.py load_catalog`), then `python manage.py runserver` again.

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
