import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ThreeDCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const shardCount = 8;
    const shards: THREE.Mesh[] = [];
    const colors = ['#e60012', '#ff00c1', '#ffffff', '#e60012', '#ff00c1'];

    for (let i = 0; i < shardCount; i++) {
      const size = 0.8 + Math.random() * 1.5;
      const geometry = new THREE.OctahedronGeometry(size, 0);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.1,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12,
        -3 - Math.random() * 8
      );

      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 + Math.random() * 0.3 });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      mesh.add(wireframe);

      (mesh as any)._speed = 0.05 + Math.random() * 0.2;
      (mesh as any)._rotOffset = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
      (mesh as any)._floatOffset = Math.random() * Math.PI * 2;
      (mesh as any)._floatSpeed = 0.3 + Math.random() * 0.5;
      (mesh as any)._floatAmp = 0.3 + Math.random() * 0.5;
      (mesh as any)._baseY = mesh.position.y;

      scene.add(mesh);
      shards.push(mesh);
    }

    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePos[i] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#e60012',
      size: 0.04,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      shards.forEach((mesh) => {
        const speed = (mesh as any)._speed;
        const rot = (mesh as any)._rotOffset;
        mesh.rotation.x = rot[0] + time * speed;
        mesh.rotation.y = rot[1] + time * speed * 1.3;
        mesh.rotation.z = rot[2] + time * speed * 0.7;

        mesh.position.y = (mesh as any)._baseY + Math.sin(time * (mesh as any)._floatSpeed + (mesh as any)._floatOffset) * (mesh as any)._floatAmp;
      });

      particles.rotation.y = time * 0.01;
      particles.rotation.x = Math.sin(time * 0.005) * 0.1;

      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (mouse.y * 1 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      shards.forEach(m => {
        scene.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      scene.remove(particles);
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
};
