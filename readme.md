**Live demo:** https://sadrda.github.io/gltfpack-test/

Compares raw GLB loading vs gltfpack-compressed progressive LODs side by side.
Left: packed LODs (2% → 10% → 25% → 50% → 100%), upgrading as each level loads.
Right: raw model.

- Throttle network in DevTools for meaningful results (10 Mbps up/down recommended)
- Uses WebP texture compression over KTX2 to avoid WASM decoder startup overhead in measurements
- Model by MONYA: https://sketchfab.com/3d-models/malice-gameoverse-read-description-b227b0d2660e46048ecbfe882cb8f198
