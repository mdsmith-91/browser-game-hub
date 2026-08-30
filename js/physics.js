const Physics2D = (() => {
  const finite = value => Number.isFinite(value) ? value : 0;
  function integrate(body, dt, friction = 0) {
    body.vx = finite(body.vx); body.vy = finite(body.vy); body.x = finite(body.x) + body.vx * dt; body.y = finite(body.y) + body.vy * dt;
    const damping = Math.max(0, 1 - friction * dt); body.vx *= damping; body.vy *= damping;
    if (Math.hypot(body.vx, body.vy) < .8) body.vx = body.vy = 0;
  }
  function collideCircles(a, b, restitution = .92) {
    const dx = b.x - a.x; const dy = b.y - a.y; const radius = a.r + b.r; const distance = Math.hypot(dx, dy);
    if (!distance || distance >= radius) return false;
    const nx = dx / distance; const ny = dy / distance; const overlap = radius - distance;
    a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative < 0) { const impulse = -(1 + restitution) * relative / 2; a.vx -= impulse * nx; a.vy -= impulse * ny; b.vx += impulse * nx; b.vy += impulse * ny; }
    return true;
  }
  function createFixedLoop(step, render, hz = 120) {
    let frame = 0; let previous = 0; let accumulator = 0; const fixed = 1 / hz; let running = false;
    function tick(time) { if (!running) return; const elapsed = Math.min(.05, (time - previous) / 1000 || 0); previous = time; accumulator += elapsed; while (accumulator >= fixed) { step(fixed); accumulator -= fixed; } render(); frame = requestAnimationFrame(tick); }
    return { start() { if (running) return; running = true; previous = performance.now(); frame = requestAnimationFrame(tick); }, stop() { running = false; cancelAnimationFrame(frame); } };
  }
  return { integrate, collideCircles, createFixedLoop };
})();
