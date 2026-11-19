Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Zira Desktop')
$s.Rate = 1 # Slightly brisk, engaging hackathon demo pace

$outputPath = Join-Path (Get-Location) 'docs/demo/voiceover.wav'
$s.SetOutputToWaveFile($outputPath)

$script = @"
Every winter across North India, over three hundred million citizens wake up to hazardous smog and alarming red A Q I numbers with zero actionable advice. Welcome to Saans, an environmental health companion built on one core principle: Code Decides, A I Explains.

Under the hood, Saans uses pure TypeScript mathematical engines with one hundred percent test coverage. Built with Vite, React, Google Cloud Run, and Firestore, Saans computes real C P C B N A Q I breakpoints and inversion physics without any L L M hallucinations.

The Living Sky dynamically mirrors atmospheric dispersion. Our seventy-two hour forecast calculates thermal inversion cycles, identifying the midday window when ventilation is safe.

Instead of generic advice, our rule engine generates personalized routines tailored to vulnerable family members, like children with asthma or elderly parents. With a single tap, daily mitigation actions export directly to your phone calendar.

In the Home Air Simulator, we solve continuous differential mass-balance physics in real time. Moving the C A D R slider recalculates indoor particle decay to meet the four point eight air-changes-per-hour A H A M standard.

In the Impact Lab, Saans strictly separates the Family Exposure Lens from the City Emissions Lens. You see micrograms of inhaled P M two point five prevented, alongside kilograms of C O two saved by taking Delhi Metro.

When you ask questions, Google Vertex A I Gemini explains the facts warmly. Our deterministic safety shield catches acute respiratory distress and immediately routes emergencies to one-one-two, while debunking viral myths with scientific citations.

Saans: science-grounded, privacy-first, and mobile-ready clean air companion for India.
"@

$s.Speak($script)
$s.Dispose()

$file = Get-Item $outputPath
Write-Host "Voiceover audio generated at: $($file.FullName) (Size: $($file.Length) bytes)"
