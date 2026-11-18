# Saans: 3-Minute Live Judge Demo Script

This script walks through the core capabilities of **Saans** in 3 minutes, demonstrating the contrast between deterministic engineering and grounded GenAI.

---

## Step 1: Living Sky & Scenario Switcher (0:00 – 0:30)

1. Open the application in your browser (Live URL: `https://saans-205781654913.asia-south1.run.app` or `http://localhost:8080`).
2. Notice the **Living Sky Hero**: displays real-time AQI, NAQI category badge, dominant pollutant (PM2.5), WHO multiple, and primary smog drivers.
3. In the **Judge Demo Bar** at the bottom of the screen, click the **"Severe"** scenario button:
   - The sky instantly transitions to a deep crimson/purple smog palette.
   - The **Today's Plan** action cards dynamically rearrange: morning walks are marked as high-risk, N95 respirators become mandatory, and indoor HEPA air purifier advice moves to top priority.

---

## Step 2: Impact Lab & Calculation Formula Drawer (0:30 – 1:00)

1. Click on the **"Impact Lab"** navigation tab.
2. Observe the strict separation of concerns:
   - **Left Panel (Family Exposure Lens)**: Inhaled PM2.5 dose in micrograms, with scientific uncertainty ranges.
   - **Right Panel (City Emissions Lens)**: Avoided carbon dioxide ($CO_2$) and particulate emissions resulting from collective household actions.
3. Adjust the **"Metro Commute Distance"** slider:
   - Watch the avoided emissions bar update in real time.
4. Click **"View Calculation Formulas"**:
   - The slide-out drawer displays the exact peer-reviewed mathematical formulas and CPCB emission factors used to compute the numbers.

---

## Step 3: Indoor Air Hub & Room Particle Simulator (1:00 – 1:30)

1. Click on the **"Indoor Air Hub"** tab.
2. In the **Room Particle Simulator**:
   - Watch the HTML5 Canvas simulation solve the continuous differential mass-balance equation in real time.
   - Click **"Turn ON HEPA Purifier"**: watch particle density rapidly decay as clean air replaces smoke.
3. Check the **"Purifier Sizing Calculator"**:
   - Enter your bedroom dimensions (e.g. 150 sq ft, 10 ft ceiling) to see the exact minimum CADR ($m^3/h$) required for 4.8 air changes per hour.

---

## Step 4: Smog Alert, Transactional Outbox & Co-Guardian Escalation (1:30 – 2:00)

1. In the Judge Demo Bar, click **"Trigger Severe Alert"**.
2. Click **"Inspect Outbox"**:
   - The modal reveals the transactional outbox ledger, showing the pending notification email with its assigned idempotency key.
3. In the Demo Bar, click **"Simulate 15m Grace Timeout"**:
   - The alert escalates automatically to the consenting co-guardian email, logging the escalation audit trail.

---

## Step 5: Ask Saans Assistant & Scientific Myth Checker (2:00 – 2:30)

1. Click the floating **"Ask Saans"** button in the lower-right corner.
2. Ask in Hindi:
   > "क्या आज सुबह की सैर पर जाना सुरक्षित है?"
3. Observe the response:
   - Advises postponing the morning walk due to boundary layer thermal inversion.
   - Carries the green **"AI-written · numbers verified"** badge.
   - Displays citations to CPCB guidelines.
4. Switch to the **Myth Checker**:
   - Enter: _"Do indoor snake plants clean PM2.5 smog?"_
   - Returns **"Unsupported"** verdict citing the Nature / Journal of Exposure Science review.

---

## Step 6: Community Dashboard & RWA Admin Portal (2:30 – 3:00)

1. Click the **"Community"** tab.
2. Notice the **$k \ge 5$ Anonymity Notice**: household data is never visible to neighbors or administrators.
3. Switch persona to **"Mr. Kulkarni (RWA Admin)"**:
   - The **Society Management Portal** appears.
   - Click **"Generate Clean Air Advisory"** to draft a society notice with anti-biomass burning directives.
   - Click **"Draft Civic Complaint"** to create a formal complaint under Section 19 of the Air Act 1981.
