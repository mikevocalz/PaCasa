import type { ThreeSetup } from '@acme/ui/three';
export interface ChatOrbVisual { busy: boolean; }

/** Frame-managed Three.js glass orb with native WebGPU + web WebGL2 fallback. */
export const createChatOrbScene: ThreeSetup<ChatOrbVisual> = ({ THREE }) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
  camera.position.set(0, 0, 6);
  const geometry = new THREE.IcosahedronGeometry(1.16, 5);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x573cb0, metalness: 0.2, roughness: 0.13,
    clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.9,
    emissive: 0x1d1164, emissiveIntensity: 0.35,
  });
  const core = new THREE.Mesh(geometry, material);
  scene.add(core);
  const auraGeometry = new THREE.SphereGeometry(1.42, 40, 32);
  const auraMaterial = new THREE.MeshBasicMaterial({
    color: 0x57befe, transparent: true, opacity: 0.12, side: THREE.BackSide,
  });
  const aura = new THREE.Mesh(auraGeometry, auraMaterial);
  scene.add(aura);
  const blue = new THREE.PointLight(0x70d7ff, 28, 15);
  blue.position.set(-2, -1, 3);
  scene.add(blue);
  const purple = new THREE.PointLight(0xcc80e8, 23, 15);
  purple.position.set(2, 2, 2);
  scene.add(purple);
  scene.add(new THREE.AmbientLight(0x1c1e39, 2));
  return {
    scene, camera,
    update(frame, state) {
      const t = frame.time;
      core.rotation.y = t * 0.23;
      core.rotation.x = Math.sin(t * 0.18) * 0.16;
      const pulse = Math.sin(t * (state.busy ? 2.4 : 0.72));
      core.scale.setScalar(1 + pulse * (state.busy ? 0.09 : 0.028));
      aura.scale.setScalar(1 + pulse * 0.045);
      auraMaterial.opacity = state.busy ? 0.18 : 0.12;
    },
    resize(width, height) { camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); },
    dispose() { geometry.dispose(); material.dispose(); auraGeometry.dispose(); auraMaterial.dispose(); },
  };
};
