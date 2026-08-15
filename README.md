# Shelfie Take Home Task

**Author:** Alejandro Noris Gil

This application allows users to capture a photo of a bookshelf (or upload one from their gallery), processes the image to detect individual book spines, and matches the extracted text against a realistically messy catalog.

**Tech Stack Overview:**

Backend: Django, SQLite, local YOLO model (for spine detection), OpenRouter API (VLM for text extraction), and thefuzz for fuzzy matching.

Frontend: React Native (Expo) and Expo Camera.

You will need **two programs running at the same time**:

1. The **backend** (Django) — analyzes the photo
2. The **frontend** (Expo) — the screen you use in the browser

Please follow these steps sequentially to ensure a smooth local setup. If you already have **Python 3.12**, Node, Git, and an OpenRouter key, you can jump to **Quick start**.

## Required versions (read this first)

This project will fail if the versions are wrong. **Python must be 3.12** (for example `3.12.8`). 3.11, 3.13, and other versions are not supported.

| Tool | Required version | How to check |
| --- | --- | --- |
| **Python** | **3.12 only** (3.12.x). Not 3.11. Not 3.13. | Windows: `py -3.12 --version` · Mac/Linux: `python3.12 --version` |
| **Node.js** | **20 or newer** (20 LTS or 22 LTS). Not 16 or 18. | `node --version` |
| **npm** | Comes with Node. | `npm --version` |

**You can keep another Python installed.** Install 3.12 next to it, then create the virtual environment with **that** 3.12 interpreter (`py -3.12` on Windows, `python3.12` on Mac). Do not use a plain `python` / `python3` if that command is not 3.12.

**Mac / Linux — `python` vs `python3.12`:**  
Use **`python3.12`** (Windows: **`py -3.12`**) only to **create** the venv. After you see `(venv)` in the prompt, use **`python`** and **`pip`**. You do not need to type `python3.12` again.

Check **before** you continue:

```bash
py -3.12 --version
```

```bash
python3.12 --version
node --version
```

You want **`Python 3.12.x`** and Node `v20.x.x` or `v22.x.x`. If Python is not 3.12, install 3.12 first (Step 0.1).

---

## Quick start (if you already have the requirements)

Use this if you already have **Python 3.12**, **Node 20+**, **Git**, and an **OpenRouter API key**. If not, skip to **Step 0**.

You still need **two terminals**. Create the venv with **Python 3.12**, even if another Python is already installed.

**Terminal 1 — backend**

```bash
git clone https://github.com/Alexnoris/Shelfie-Take-Home-Task.git
cd Shelfie-Take-Home-Task/backend
```

Windows (uses the 3.12 installer / `py` launcher):

```powershell
py -3.12 --version
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If `py -3.12` is missing, install 3.12 without removing your current Python:

```powershell
py install 3.12
```

Then run the `venv` commands again.

Mac / Linux:

```bash
python3.12 --version
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

If `python3.12` is missing on Mac:

```bash
brew install python@3.12
```

Create `backend/.env` with:

```env
OPENROUTER_API_KEY=paste_your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Then (venv still active — now just `python`, not `python3.12`):

```bash
python manage.py migrate
python manage.py load_catalog
python manage.py runserver
```

Leave this terminal running.

**Terminal 2 — frontend**

```bash
cd Shelfie-Take-Home-Task/frontend
npm install
npx expo start --tunnel
```

If the terminal says **ngrok tunnel took too long to connect**, run `npx expo start --tunnel` again.

Copy the `https://` URL and paste it in your **phone** browser. That is the recommended way to use the app.

For example: `https://xxxx.exp.direct`

There are two sample book photos in `backend/api/img/` (`dun.jpg` and `hob.jpg`) if you want to use them to try the app.

If anything fails, please use the full steps below.

---

## Step 0 — Install these programs first

You only do this once on a computer.

### 0.1 Python 3.12 only (required)

This app needs **Python 3.12.x**. It does not work with 3.11, 3.13, or other versions.

You do **not** have to uninstall the Python you already have. Install 3.12 next to it, then always create the project venv with 3.12.

**Windows — if Python is already installed**

1. Open PowerShell and see which versions you have:

```powershell
py --list
```

2. If 3.12 is missing, install it (this does not replace your other Python):

```powershell
py install 3.12
```

If `py install` is not available, use:

```powershell
winget install Python.Python.3.12
```

Or download **3.12** from [https://www.python.org/downloads/release/python-31210/](https://www.python.org/downloads/release/python-31210/) and check **Add python.exe to PATH**.

3. Confirm 3.12 (you must see `Python 3.12.x`):

```powershell
py -3.12 --version
```

**Mac — if Python is already installed**

1. Check whether 3.12 exists:

```bash
python3.12 --version
```

2. If it is missing, install 3.12 with Homebrew (this does not remove your other Python):

```bash
brew install python@3.12
```

You may need:

```bash
brew link python@3.12
```

Or download **macOS 64-bit universal2 installer** for **3.12** from [python.org](https://www.python.org/downloads/release/python-31210/).

3. Confirm 3.12:

```bash
python3.12 --version
```

You must see **Python 3.12.x**. If you see 3.11 or 3.13, that interpreter is the wrong one. Keep going only with `py -3.12` (Windows) or `python3.12` (Mac).

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

**Important:** `py -3.12` / `python3.12` are only for creating the venv. After `(venv)` is active, use `python` and `pip` on every OS.

### 2.1 Go into the backend folder

```bash
cd backend
```

### 2.2 Create a virtual environment

This is a private Python folder for this project only. Create it with **Python 3.12**, even if `python --version` shows something else.

**Windows (PowerShell):**

```powershell
py -3.12 --version
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

Confirm the venv is 3.12:

```powershell
python --version
```

If Windows says the script is disabled, run this **once**, then run `Activate.ps1` again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

If `py -3.12` is not found, go back to Step 0.1 and run `py install 3.12`.

**Mac / Linux** (use **`python3.12`**):

```bash
python3.12 --version
python3.12 -m venv venv
source venv/bin/activate
python --version
```

`python --version` inside `(venv)` must say **3.12.x**. If it does not, delete the `venv` folder and create it again with `python3.12 -m venv venv`.

If `python3.12` is not found, go back to Step 0.1 (`brew install python@3.12`).

The start of your terminal line should now show `(venv)`. If you do not see `(venv)`, the environment is not active. Stop and fix that before continuing.

Inside `(venv)`, use **`python`** and **`pip`** from now on. You do not need `python3.12` or `py -3.12` again unless you recreate the venv.

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

If you see **ngrok tunnel took too long to connect** (or the tunnel hangs), press `Ctrl+C` and run the same command again:

```bash
npx expo start --tunnel
```

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

### Sample photos to test with

In `backend/api/img/` there are two test images you can use if you do not have a bookshelf or books nearby:

- `dun.jpg`
- `hob.jpg`

You can:

- send them to your phone and pick them with **Choose from gallery**, or
- open an image on your computer screen and **Take a photo** of it with the phone.

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
python manage.py runserver
```

If `python --version` is not **3.12.x** after activate, recreate the venv with `python3.12 -m venv venv`, then activate again and use `python` as usual.

**Terminal 2 — frontend**

```bash
cd frontend
npx expo start --tunnel
```

Wait for the `https://` URL, copy it, and paste it in your **phone** browser. That is the recommended way to use the app. If it says **ngrok tunnel took too long to connect**, press `Ctrl+C` and run `npx expo start --tunnel` again.

---

## If something goes wrong

**I do not see `(venv)`**  
Go to the `backend` folder and activate it again (`Activate.ps1` on Windows, `source venv/bin/activate` on Mac/Linux).

**`python` is not found**  
Activate the venv first (`.\venv\Scripts\Activate.ps1` or `source venv/bin/activate`). Inside `(venv)` the command is just `python`. Use `python3.12` / `py -3.12` only when **creating** the venv.

**My Python is not 3.12**  
This app needs **Python 3.12 only**. Check with `py -3.12 --version` (Windows) or `python3.12 --version` (Mac). Install 3.12 next to your current Python (`py install 3.12` or `brew install python@3.12`), then create a **new** venv with that interpreter.

**`pip install` fails**  
Confirm the venv is 3.12 (`python --version` after activate). Delete `backend/venv`, create it again with `py -3.12 -m venv venv` or `python3.12 -m venv venv`, activate it, and run `pip install -r requirements.txt` once more. You need a stable internet connection.

**The app says it could not process the image, or the catalog does not load**  
The backend is not running. Go back to Step 2.6.

**The app says there are no books in the catalog**  
In the backend terminal: stop the server with `Ctrl+C`, activate `(venv)`, run `python manage.py load_catalog`, then `python manage.py runserver` again.

**Photos are analyzed but titles are empty / no good matches**  
Check that `backend/.env` has a real `OPENROUTER_API_KEY`. Stop the backend with `Ctrl+C` and start it again so it reads the file.

**The camera does not work**  
Open the `https://` tunnel URL from `npx expo start --tunnel`. HTTP links (`localhost` or `192.168...`) block the camera.

**The tunnel is slow or does not connect**  
If you see **ngrok tunnel took too long to connect**, press `Ctrl+C` and run `npx expo start --tunnel` again. Wait until it says `Tunnel ready`. Keep both terminals open. You need internet for the tunnel.

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
│       └── img/             # Sample photos: dun.jpg, hob.jpg
└── frontend/
    ├── package.json
    └── src/
        ├── app/             # Screens + Expo API proxies
        └── services/api.js  # Frontend → Expo → Django
```

---
