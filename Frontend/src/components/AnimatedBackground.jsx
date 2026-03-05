import { useEffect, useRef } from "react";

const NODE_COUNT   = 62;
const MAX_DIST     = 175;   // max distance to draw a connection line
const PACKET_RATE  = 1200;  // ms between new packets spawning
const MOUSE_FORCE  = 0.012; // how strongly nodes are attracted to mouse

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    // ── Resize ──────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Nodes ───────────────────────────────────────────────
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:  rand(0, canvas.width),
      y:  rand(0, canvas.height),
      vx: rand(-0.28, 0.28),
      vy: rand(-0.28, 0.28),
      r:  rand(1.5, 3.2),
    }));

    // ── Packets ─────────────────────────────────────────────
    // Each packet: { from, to, progress (0-1), speed }
    let packets = [];
    const spawnPacket = () => {
      // Pick a random node that has at least one neighbour in range
      const from = Math.floor(Math.random() * NODE_COUNT);
      const neighbours = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        if (i === from) continue;
        const dx = nodes[from].x - nodes[i].x;
        const dy = nodes[from].y - nodes[i].y;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_DIST) neighbours.push(i);
      }
      if (neighbours.length === 0) return;
      const to = neighbours[Math.floor(Math.random() * neighbours.length)];
      packets.push({ from, to, progress: 0, speed: rand(0.007, 0.016) });
    };

    const packetTimer = setInterval(spawnPacket, PACKET_RATE);

    // ── Mouse ────────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999 };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMouseMove);

    // ── Draw loop ────────────────────────────────────────────
    let rafId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move nodes + subtle mouse attraction
      for (const n of nodes) {
        const mdx = mouse.x - n.x;
        const mdy = mouse.y - n.y;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 300) {
          n.vx += (mdx / md) * MOUSE_FORCE;
          n.vy += (mdy / md) * MOUSE_FORCE;
        }

        // Speed cap
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 0.6) { n.vx *= 0.6 / speed; n.vy *= 0.6 / speed; }

        n.x += n.vx;
        n.y += n.vy;

        // Bounce off edges
        if (n.x < 0)              { n.x = 0;              n.vx *= -1; }
        if (n.x > canvas.width)   { n.x = canvas.width;   n.vx *= -1; }
        if (n.y < 0)              { n.y = 0;              n.vy *= -1; }
        if (n.y > canvas.height)  { n.y = canvas.height;  n.vy *= -1; }
      }

      // Draw connection lines
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_DIST) continue;

          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(180,18,27,${alpha})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const n of nodes) {
        // Outer glow ring
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grd.addColorStop(0, "rgba(217,30,40,0.35)");
        grd.addColorStop(1, "rgba(217,30,40,0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(217,30,40,0.75)";
        ctx.fill();
      }

      // Draw packets (tiny bright dots traveling along edges)
      packets = packets.filter((p) => p.progress < 1);
      for (const p of packets) {
        p.progress += p.speed;
        const t  = p.progress;
        const nx = nodes[p.from].x + (nodes[p.to].x - nodes[p.from].x) * t;
        const ny = nodes[p.from].y + (nodes[p.to].y - nodes[p.from].y) * t;

        // Trail
        const tg = ctx.createRadialGradient(nx, ny, 0, nx, ny, 6);
        tg.addColorStop(0, "rgba(255,77,87,0.9)");
        tg.addColorStop(1, "rgba(255,77,87,0)");
        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = tg;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(packetTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default AnimatedBackground;
