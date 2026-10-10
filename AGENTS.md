# Spatial starter contracts

Carry these product requirements forward when editing the starter:

- Use Zustand for React application and component state. Per-instance state uses a vanilla store retained in a ref and selector subscriptions. Native resources and imperative handles stay in refs; never introduce React useState.
- In native apps, bottom tabs belong only to ordinary phones. All native foldables, including folded covers and tabletop, tablets and headsets keep navigation on the physical RIGHT, also in RTL. Do not infer device family only from current window width or active hinge geometry.
- Match the MoyoLearn hardware-column pattern: use the actual Duo column width, consume its safe-area inset once, and center navigation vertically. Keep the brand lockup in the persistent app header.
- Web header includes desktop destination links and a navigation menu on smaller screens. Web never shows a side rail. Phone-width web also has bottom tabs; the header remains outside scrolling content. Menu selection, close, Escape and Android back dismiss it.
- Editorial content fills compact/folded space and uses a centered max-w-4xl cap when wide. Grids respond to available content width. Story cards use 60% media on the left and 40% text on the right (`EditorialCard`).
- Native Workspace uses a 40/60 list/detail split and a 30% inspector overlay. Opening it must not resize, replace or remove the underlying panes. Compact flat windows use full-width detail. Keep this screen-specific; do not silently change other consumers' pane policies.
- Preserve each centre stage's authored aspect ratio. Inspector visibility cannot change it. Gallery close controls must clear safe areas and sit above navigation hit targets.
- On Quest preserve expo-horizon-core, orientation default, and the established 1280x800dp app window. App windows and Viro scene objects have separate dimensions/positions. Ask before changing the window contract.
- Native/config plugins must merge manifest metadata and layout entries. Verify generated variants and manifests; add regression coverage for configuration loss.
- Register Viro scene resources only when the renderer is present and a scene mounts. A missing native renderer should show an honest fallback, not startup MaterialManager errors.
- Do not claim device/headset validation from a browser check. Record which platform actually ran.
