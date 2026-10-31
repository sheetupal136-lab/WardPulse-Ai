import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MiniatureCityProps {
  className?: string;
}

export const MiniatureCity: React.FC<MiniatureCityProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene setup
    const scene = new THREE.Scene();

    // Isometric Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    const d = 11;
    const camera = new THREE.OrthographicCamera(
      -d * aspect,
      d * aspect,
      d,
      -d,
      1,
      1000
    );
    // Standard 45-degree isometric angle
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // City Group
    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // Base Island / Ground
    const groundGeo = new THREE.BoxGeometry(16, 0.8, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.4;
    ground.receiveShadow = true;
    cityGroup.add(ground);

    // Grass verge
    const grassGeo = new THREE.BoxGeometry(15.4, 0.1, 15.4);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x93C5FD,
      roughness: 0.9,
      metalness: 0.05
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = 0.05;
    grass.receiveShadow = true;
    cityGroup.add(grass);

    // Road Grid (Cross intersection)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.8
    });

    const roadXGeo = new THREE.BoxGeometry(15.4, 0.12, 2.2);
    const roadX = new THREE.Mesh(roadXGeo, roadMat);
    roadX.position.y = 0.06;
    roadX.receiveShadow = true;
    cityGroup.add(roadX);

    const roadZGeo = new THREE.BoxGeometry(2.2, 0.12, 15.4);
    const roadZ = new THREE.Mesh(roadZGeo, roadMat);
    roadZ.position.y = 0.06;
    roadZ.receiveShadow = true;
    cityGroup.add(roadZ);

    // Palette of building pastel colors
    const buildingColors = [
      0x3B82F6, // Vibrant Primary
      0x60A5FA, // Sky Blue
      0x14B8A6, // Teal Accent
      0x2DD4BF, // Soft Teal
      0x6366F1, // Indigo
      0xF1F5F9, // Off white
      0xE2E8F0  // Light slate
    ];

    // Procedural Buildings in 4 Quadrants
    const quadrants = [
      { startX: -6, endX: -2, startZ: -6, endZ: -2 },
      { startX: 2, endX: 6, startZ: -6, endZ: -2 },
      { startX: -6, endX: -2, startZ: 2, endZ: 6 },
      { startX: 2, endX: 6, startZ: 2, endZ: 6 },
    ];

    const beaconPositions: THREE.Vector3[] = [];

    quadrants.forEach((q, qIdx) => {
      // 3 to 4 buildings per quadrant
      const bCount = 3;
      for (let i = 0; i < bCount; i++) {
        const width = 1.2 + Math.random() * 0.8;
        const depth = 1.2 + Math.random() * 0.8;
        const height = 1.8 + Math.random() * 3.2;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const color = buildingColors[(qIdx + i) % buildingColors.length];
        const bMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.15
        });

        const building = new THREE.Mesh(bGeo, bMat);
        const posX = q.startX + (i % 2) * 2.2 + Math.random() * 0.4;
        const posZ = q.startZ + Math.floor(i / 2) * 2.2 + Math.random() * 0.4;
        building.position.set(posX, height / 2 + 0.1, posZ);
        building.castShadow = true;
        building.receiveShadow = true;
        cityGroup.add(building);

        // Rooftop detail (helipad or AC unit)
        if (Math.random() > 0.4) {
          const roofGeo = new THREE.BoxGeometry(width * 0.4, 0.3, depth * 0.4);
          const roofMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.5 });
          const roofMesh = new THREE.Mesh(roofGeo, roofMat);
          roofMesh.position.set(posX, height + 0.25, posZ);
          cityGroup.add(roofMesh);
        }

        // Add a beacon pin on top of the tallest building in this quadrant
        if (i === 1) {
          beaconPositions.push(new THREE.Vector3(posX, height + 0.9, posZ));
        }
      }

      // Add a couple of trees per quadrant
      for (let t = 0; t < 2; t++) {
        const treeTrunkGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6);
        const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });
        const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);

        const treeTopGeo = new THREE.DodecahedronGeometry(0.45);
        const treeTopMat = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.7 });
        const top = new THREE.Mesh(treeTopGeo, treeTopMat);
        top.position.y = 0.45;

        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(top);

        const tX = q.startX + (t === 0 ? 0.3 : 2.8);
        const tZ = q.endZ - 0.2;
        tree.position.set(tX, 0.3, tZ);
        tree.castShadow = true;
        cityGroup.add(tree);
      }
    });

    // Glowing Pulse Beacons (Location nodes)
    const beacons: THREE.Mesh[] = [];
    const beaconRings: THREE.Mesh[] = [];

    beaconPositions.forEach((pos, idx) => {
      // Beacon Sphere
      const sphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const isCritical = idx === 0 || idx === 2;
      const beaconMat = new THREE.MeshBasicMaterial({
        color: isCritical ? 0x2563EB : 0x14B8A6
      });
      const beaconMesh = new THREE.Mesh(sphereGeo, beaconMat);
      beaconMesh.position.copy(pos);
      cityGroup.add(beaconMesh);
      beacons.push(beaconMesh);

      // Pulse Ring
      const ringGeo = new THREE.RingGeometry(0.3, 0.45, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isCritical ? 0x60A5FA : 0x2DD4BF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(pos.x, pos.y - 0.1, pos.z);
      cityGroup.add(ringMesh);
      beaconRings.push(ringMesh);
    });

    // Connection lines between beacons (Subtle animated municipal telemetry paths)
    if (beaconPositions.length >= 2) {
      const lineMaterial = new THREE.LineDashedMaterial({
        color: 0x3B82F6,
        dashSize: 0.4,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.5
      });

      const linePoints = [
        beaconPositions[0],
        beaconPositions[1],
        beaconPositions[2] || beaconPositions[0],
        beaconPositions[3] || beaconPositions[1]
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMesh = new THREE.Line(lineGeo, lineMaterial);
      lineMesh.computeLineDistances();
      cityGroup.add(lineMesh);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    dirLight.position.set(25, 35, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    const shadowD = 12;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x60A5FA, 0.4);
    blueRimLight.position.set(-20, 15, -20);
    scene.add(blueRimLight);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        const elapsedTime = clock.getElapsedTime();

        // Slow floating motion
        cityGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.18;

        // Gentle camera rotation / sway
        cityGroup.rotation.y = Math.sin(elapsedTime * 0.25) * 0.08;

        // Beacon pulsing animation
        beaconRings.forEach((ring, idx) => {
          const scale = 1 + (Math.sin(elapsedTime * 2.5 + idx) * 0.35 + 0.35);
          ring.scale.set(scale, scale, scale);
          const mat = ring.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0.1, 0.8 - (scale - 1) * 0.9);
        });

        beacons.forEach((b, idx) => {
          b.position.y = beaconPositions[idx].y + Math.sin(elapsedTime * 3 + idx) * 0.12;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      const newAspect = width / height;
      camera.left = -d * newAspect;
      camera.right = d * newAspect;
      camera.top = d;
      camera.bottom = -d;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGlSupported) {
    // Static Fallback SVG
    return (
      <div className={`w-full h-full flex items-center justify-center p-6 bg-blue-50/50 dark:bg-slate-800/40 rounded-2xl border border-[var(--border-color)] ${className}`}>
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-2xl">
            🏙️
          </div>
          <h4 className="text-sm font-bold text-[var(--text-main)]">Municipal Ward Network</h4>
          <p className="text-xs text-[var(--text-muted)] max-w-xs">
            Interactive 3D visualization disabled (WebGL unsupported or reduced motion enabled).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative cursor-grab active:cursor-grabbing select-none ${className}`}
      aria-label="Interactive 3D procedural miniature city representing municipal wards"
    />
  );
};

export default MiniatureCity;
