# ADR 0004: Air Quality Impact Models and Data Provenance

## Status

Accepted

## Context

Urban air quality platforms often mislead citizens by conflating personal health exposure (the microgram PM2.5 dose inhaled into lungs) with municipal emissions (the kilograms of particulate matter emitted into the city air). Furthermore, platforms frequently present single ungrounded point estimates that create a false impression of mathematical precision. Saans requires rigorous, peer-reviewed, physics-based calculation models with transparent provenance and honest uncertainty quantification.

## Decisions

1. **Strict Two-Lens Separation:**
   - **Lens 1: Inhaled Dose Exposure (Personal Health)**: Evaluates the mass of PM2.5 inhaled ($\mu\text{g}$) by individuals across microenvironments (indoors, commute, outdoor activity). Implemented in `server/src/core/exposure.ts`.
   - **Lens 2: Avoided Emissions (Urban Atmosphere)**: Evaluates the mass of pollutants ($\text{kg PM2.5}$, $\text{kg CO}_2$) prevented from entering the municipal airshed through behavioral choices (EV/metro transit instead of diesel, solar instead of diesel generator, composting instead of open burning). Implemented in `server/src/core/emissions.ts`.
   - **Invariable Principle**: The UI and APIs never combine or equate avoided emissions with inhaled exposure.

2. **Indoor Particle Concentration Mass-Balance Physics:**
   - Indoor air quality is modeled in `server/src/core/indoor.ts` via the continuous mass-balance differential equation:
     $$\frac{dC_{\text{in}}}{dt} = a \cdot C_{\text{out}} - \left(a + k + \frac{\text{CADR}}{V}\right) C_{\text{in}} + \frac{S}{V}$$
   - Parameters:
     - $a$: Air exchange rate ($h^{-1}$), varying by window state (tight seal $\approx 0.5$, cracked $\approx 1.5$, open $\approx 4.0$).
     - $k$: Natural wall and surface deposition rate constant ($\approx 0.2\ h^{-1}$).
     - $\text{CADR}$: Clean Air Delivery Rate of HEPA filtration ($m^3/h$).
     - $V$: Room volume ($m^3$).
     - $S$: Indoor emission sources (cooking, incense, smoking) ($\mu\text{g}/h$).
   - Closed-form exponential decay solutions calculate accurate time-to-clean and steady-state values.

3. **Inhaled Dose Calculation with Activity Factors:**
   - Cumulative lung dose is computed as:
     $$D = \sum_{i=1}^{N} C_i \cdot V_{E,\text{activity}} \cdot t_i$$
   - Ventilation rates ($V_E$) are drawn from the US EPA Exposure Factors Handbook:
     - Sleep / Rest: $0.3\ \text{m}^3/\text{h}$
     - Sedentary / Office: $0.5\ \text{m}^3/\text{h}$
     - Light Exercise / Walking: $1.2\ \text{m}^3/\text{h}$
     - Heavy Exercise / Running: $2.5\ \text{m}^3/\text{h}$

4. **Rigorous Data Provenance & Emission Factors:**
   - Emission factors in `server/src/data/emission-factors.json` are strictly referenced from official Indian and international standards:
     - **Automotive Emissions**: ARAI (Automotive Research Association of India) emission factors for BS-VI vs BS-IV vehicles.
     - **Grid Electricity**: CEA (Central Electricity Authority) CO2 baseline database for Indian national grid ($0.716\ \text{kg CO}_2/\text{kWh}$).
     - **Diesel Generators**: CPCB diesel genset particulate emission standards ($0.2\ \text{g PM2.5}/\text{kWh}$).
     - **Indoor Cookstove / Biogas**: CPCB emission inventories and WHO indoor air quality guidelines.

5. **Honest Uncertainty Ranges:**
   - Inhaled dose and exposure metrics are presented with lower ($-15\%$) and upper ($+20\%$) uncertainty bounds reflecting natural biological variation in tidal volume and microenvironment infiltration variance. Single point figures are never asserted as absolute truth without their confidence range.

## Consequences

- Calculations remain verifiable by epidemiologists, environmental engineers, and civic authorities.
- The system achieves 100% test coverage through pure domain engines with zero external dependencies.
- Users gain credible, defensible insights into both their personal lung protection and their civic climate contributions.
