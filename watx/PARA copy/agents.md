# PARA Project: Agent & Developer Knowledge Base

This file serves as a high-fidelity "Brain" for future AI agents and human developers working on the PARA project. It tracks the core architecture, fundamental design decisions, and local environment quirks that aren't captured in the code comments alone.

---

## 🏛️ Project Architecture & DNA

PARA is a React Native mobile application built on the **AT Protocol (atproto)** architecture. It uses a custom lexicon layer (`com.para`) to extend or specialize its functionality.

### Core Stack

- **Framework:** React Native (Native/Web parity via `.web.tsx` files).
- **Styling (`Alf`):** A custom, atomic-based design system (`src/alf`). Components should use `atoms` (aliased as `a`) for layout and `useTheme` for semantic coloring.
- **Data Layer:** Lexicon-driven APIs. Types and definitions are located in `src/lib/api/para-lexicons.ts`.
- **Localization:** Managed via `@lingui/js`. Message files are located in `src/locale/locales/`.

---

## 🛠️ Local Development & Environment Quirks

### iOS Provisioning & App Clips

- **Issue:** The project includes an Apple App Clip target (`PARAAppClip`).
- **Personal Team Limitation:** Personal Apple Developer Teams (free accounts) do *not* support the "App Clip" capability or the associated provisioning profiles.
- **Current Setup:** The `PARAAppClip` target has been manually removed from the Xcode project to allow local deployments to physical devices.
- **Future Reversion:** If building for production or a paid Enterprise/Organization team, restore the `PARAAppClip` target from `ios/PARA.xcodeproj/project.pbxproj` and ensure the `com.miguelabundis.para.AppClip` identifier is correctly provisioned.

### Local PDS Connection (Networking)

- **Issue:** The app needs to connect to a local Personal Data Server (PDS) running on the development machine.
- **Problem:** Hardcoded IP addresses in `src/lib/constants.ts` can drift if the host machine's local IP changes.
- **Technical Note:** `LOCAL_DEV_SERVICE` for iOS is configured to `http://192.168.100.31:2583`. This must match the host machine's local IP for physical device connectivity.

### Java & macOS Build Requirements

- **JDK Version:** You **must** use Zulu 17. Ensure your `JAVA_HOME` points to exactly this path in your `.zshrc` or `.bashrc`:
  `export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`
- **Apple Silicon (M1/M2/M3):** If building for RN 0.74+ for the first time on ARM, you may need to run:

  ```bash
  arch -arm64 brew install llvm
  sudo gem install ffi
  ```

---

### 2026-03-01: App Clip Target Removal

- **Decision:** Deleted `PARAAppClip` from Targets.
- **Reasoning:** Unblocks dev loop on physical hardware (see *iOS Provisioning* section above).
- **Functionality Loss:** Temporary loss of native App Clip preview testing. Main app routing and business logic are unaffected.

---

## 📝 Future Agent Onboarding (Handover Notes)

If you are a new agent taking over this workspace:

1. **Check the Lexicons:** Before modifying API calls, inspect `src/lib/api/para-lexicons.ts` to understand the data schema.
2. **Respect the Atoms:** Always use the `alf` design system. Do not write ad-hoc CSS/Styles unless absolutely necessary for custom animations.
3. **Check target files:** This codebase supports both Native and Web. When modifying a screen, check if a `.web.tsx` counterpart exists to maintain parity.
