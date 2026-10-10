# Unity Developer — Build Request Message

Jab bhi new Unity build chahiye ho, neeche wala message copy karke Unity dev ko bhej do.

---

## Message to send:

```
Hi,

Naya Unity build chahiye ElmonX app ke liye. Dono platforms ke liye please:

---

**iOS Export:**
- Unity version: 6000.3.16f1 (same rakhna — version change kiya toh batana)
- Export type: Xcode project (Unity > Build Settings > iOS > Build)
- Export settings:
  - Target SDK: Device SDK
  - Architecture: ARM64
  - IL2CPP scripting backend
  - Development Build: OFF (Release build)
  - Strip Engine Code: OFF
- ARCore/ARKit enabled rakhna
- Firebase included rakhna

**Android Export:**
- Unity version: 6000.3.16f1 (same rakhna)
- Export type: Android Gradle Project (Unity > Build Settings > Android > Export Project ✓)
- Export settings:
  - Target Architecture: ARM64 + ARMv7
  - IL2CPP scripting backend
  - Minify: OFF (both Release and Debug)
  - Development Build: OFF
  - Export as Gradle Project: YES (important — APK nahi chahiye, Gradle project chahiye)
- ARCore enabled rakhna
- Firebase included rakhna

---

**Important notes:**
1. Dono platforms ka build SAME Unity version se banana — alag versions se problems aati hain
2. WeTransfer ya Google Drive pe upload karke link bhejo
3. Android export mein NDK path Windows-specific mat rakhna — hum khud fix kar lete hain
4. Agar koi naya plugin add kiya hai toh batana (especially iOS side)

Thanks
```

---

## Notes for us (internal — don't send):

- iOS export milne ke baad: [[unity-integration-ios]] follow karo
- Android export milne ke baad: [[unity-integration-android]] follow karo  
- Dono ke liye Back Button patch lagana ZAROOR hai — [[unity-new-export-checklist]] dekho
- iOS export mein Google Sign-In plugin hoga (export 07 se) — usse no-op stubs se replace karna hai
- Android export Windows machine se bana hoga — ndkPath fix karna hai, deploy_arm64 add karna hai
